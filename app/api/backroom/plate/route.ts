import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { BACKROOM_COOKIE, isDoorOpen, isTriggerOpen } from "@/lib/backroom-auth";
import { PublishError, commitFiles, readRepoFile } from "@/lib/githubPublish";
import { generateImage, uploadFile } from "@/lib/replicate";
import {
  CAST,
  type Cast,
  type PlateSpec,
  blankDuoPrompt,
  blankTrioPrompt,
  composeGag,
  pasteRegions,
  platePath,
  plateSpecPath,
  sourcePlatePath,
  speakerPlatePath,
  speakerPrompt,
  toPlateSize,
  tvStillPrompt,
} from "@/lib/plates";

// THE PLATE DESK. One step per request, one image per step, the founder
// looking at every result before the next credit is spent. Every output is
// committed under canon/plates/work/ so nothing generated is ever lost, and
// the response is a page showing the picture with the prompt beneath it.
//
//   ?step=blank&cast=duo|trio          draw the blank plate (screen off, slate wiped)
//   ?step=approve&cast=duo&file=<name> promote a work/ file to canon/plates/<cast>.png
//   ?step=speaker&cast=duo&who=drew    draw the speaker variant, paste its mouth/eyes into the plate
//   ?step=still&footage=<text>         draw one TV still (3:2, no words) into work/stills/
//   ?step=compose&cast=duo&who=drew&still=<name>&chyron=..&board=a|b|c&caption=..
//                                      assemble a gag in code from approved parts
//
// Optional on every drawing step: &quality=low|medium|high (default high for
// plates and speakers — they are drawn once — and medium for stills).

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "openai/gpt-image-2";
const WORK = "canon/plates/work";

function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z").replace("T", "-");
}

async function mustRead(path: string): Promise<Buffer> {
  const file = await readRepoFile(path);
  if (!file) throw new PublishError(404, `${path} is not in the repo yet.`);
  return file.bytes;
}

async function readSpec(cast: Cast): Promise<PlateSpec> {
  const bytes = await mustRead(plateSpecPath(cast));
  return JSON.parse(bytes.toString("utf8")) as PlateSpec;
}

async function upload(bytes: Buffer, name: string): Promise<string> {
  const jpeg = await sharp(bytes).flatten({ background: "#ffffff" }).grayscale().resize({ width: 1200, withoutEnlargement: true }).jpeg({ quality: 92 }).toBuffer();
  return uploadFile(jpeg, name, "image/jpeg");
}

async function draw(prompt: string, refs: string[], quality: string, aspect = "2:3"): Promise<Buffer> {
  return generateImage(MODEL, {
    prompt,
    input_images: refs,
    quality,
    moderation: "low",
    aspect_ratio: aspect,
    output_format: "png",
    number_of_images: 1,
  }, 280_000);
}

function page(title: string, image: Buffer, notes: string[], committed: string): Response {
  const html = `<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title>
<body style="margin:0;background:#f8f5ee;font:16px Georgia,serif;color:#171717">
<div style="max-width:900px;margin:0 auto;padding:16px">
<h1 style="font-size:20px;margin:0 0 12px">${title}</h1>
<img src="data:image/png;base64,${image.toString("base64")}" style="width:100%;height:auto;display:block;border:1px solid #ccc">
<p style="font-size:13px;color:#555">committed as <code>${committed}</code></p>
${notes.map((n) => `<pre style="white-space:pre-wrap;font:13px/1.4 monospace;background:#fff;padding:12px;border:1px solid #ddd">${n.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c] as string)}</pre>`).join("")}
</div>`;
  return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

export async function GET(request: NextRequest) {
  const authed =
    (await isDoorOpen(request.cookies.get(BACKROOM_COOKIE)?.value)) ||
    (await isTriggerOpen(request.nextUrl.searchParams.get("t")));
  if (!authed) return NextResponse.json({ error: "The door is closed. Knock first." }, { status: 401 });

  const p = request.nextUrl.searchParams;
  const step = p.get("step") ?? "";
  const cast = (p.get("cast") ?? "duo") as Cast;
  if (!(cast in CAST)) return NextResponse.json({ error: "cast must be duo or trio" }, { status: 400 });

  try {
    if (step === "blank") {
      const quality = p.get("quality") ?? "high";
      const refs: string[] = [];
      let prompt: string;
      if (cast === "duo") {
        refs.push(await upload(await mustRead(sourcePlatePath("duo")), "duo-source.jpg"));
        refs.push(await upload(await mustRead("canon/vision/staging-plate.jpg"), "empty-set.jpg"));
        prompt = blankDuoPrompt();
      } else {
        // The trio inherits the APPROVED duo plate — never the trio source,
        // whose bar is the thing that was wrong.
        refs.push(await upload(await mustRead(platePath("duo")), "duo-plate.jpg"));
        refs.push(await upload(await mustRead("canon/vision/studies/abby.png"), "abby.jpg"));
        prompt = blankTrioPrompt();
      }
      const art = await draw(prompt, refs, quality);
      const fitted = await sharp(art).flatten({ background: "#ffffff" }).grayscale().resize({ width: 1200 }).png().toBuffer();
      const name = `${stamp()}-${cast}-blank.png`;
      await commitFiles([{ path: `${WORK}/${name}`, content: fitted }], `plates: ${cast} blank candidate ${name}`);
      return page(`${cast} blank plate — candidate`, fitted, [prompt], `${WORK}/${name}`);
    }

    if (step === "approve") {
      const file = p.get("file");
      if (!file) throw new PublishError(400, "file=<name under canon/plates/work/> is required.");
      const bytes = await mustRead(`${WORK}/${file}`);
      const meta = await sharp(bytes).metadata();
      const who = p.get("who");
      const target = who ? speakerPlatePath(cast, who) : platePath(cast);
      await commitFiles([{ path: target, content: bytes }], `plates: approve ${file} as ${target}`);
      return page(`approved → ${target}`, bytes, [`${meta.width}×${meta.height}. ${who ? "" : `Now measure the screen, the slate and each face into ${plateSpecPath(cast)}.`}`], target);
    }

    if (step === "speaker") {
      const who = (p.get("who") ?? "").toLowerCase();
      if (!CAST[cast].includes(who)) throw new PublishError(400, `who must be one of ${CAST[cast].join(", ")}`);
      const quality = p.get("quality") ?? "high";
      const plate = await mustRead(platePath(cast));
      const spec = await readSpec(cast);
      const prompt = speakerPrompt(cast, who);
      const raw = await draw(prompt, [await upload(plate, `${cast}-plate.jpg`)], quality);
      const fitted = await toPlateSize(raw, spec);
      // Only the faces move. The speaker's mouth and every listener's eyes are
      // taken from the variant; the rest of the picture is the plate itself.
      const boxes = [spec.faces[who].mouth, ...CAST[cast].filter((c) => c !== who).map((c) => spec.faces[c].eyes)];
      const pasted = await pasteRegions(plate, fitted, boxes);
      const name = `${stamp()}-${cast}-${who}`;
      await commitFiles(
        [
          { path: `${WORK}/${name}-raw.png`, content: fitted },
          { path: `${WORK}/${name}.png`, content: pasted },
        ],
        `plates: ${cast} speaker variant ${who}`
      );
      return page(`${cast} / ${who} speaking — pasted into the plate`, pasted, [prompt, `raw model output kept at ${WORK}/${name}-raw.png`], `${WORK}/${name}.png`);
    }

    if (step === "still") {
      const footage = p.get("footage");
      if (!footage) throw new PublishError(400, "footage=<what the screen shows> is required.");
      const quality = p.get("quality") ?? "medium";
      const prompt = tvStillPrompt(footage);
      const raw = await draw(prompt, [], quality, "3:2");
      const still = await sharp(raw).flatten({ background: "#ffffff" }).grayscale().resize({ width: 900 }).png().toBuffer();
      const slug = footage.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 40);
      const name = `${stamp()}-${slug}.png`;
      await commitFiles([{ path: `${WORK}/stills/${name}`, content: still }], `plates: TV still ${slug}`);
      return page(`TV still — ${footage}`, still, [prompt], `${WORK}/stills/${name}`);
    }

    if (step === "compose") {
      const who = (p.get("who") ?? "").toLowerCase();
      if (!CAST[cast].includes(who)) throw new PublishError(400, `who must be one of ${CAST[cast].join(", ")}`);
      const caption = p.get("caption") ?? "";
      if (!caption) throw new PublishError(400, "caption=<the line> is required.");
      const spec = await readSpec(cast);
      const variant = await readRepoFile(speakerPlatePath(cast, who));
      const plate = variant ? variant.bytes : await mustRead(platePath(cast));
      const stillName = p.get("still");
      const still = stillName ? await mustRead(`${WORK}/stills/${stillName}`) : null;
      const out = await composeGag({
        plate,
        spec,
        still,
        chyron: p.get("chyron") ?? "",
        board: (p.get("board") ?? "").split("|"),
        speaker: who,
        caption,
        time: p.get("time") ?? undefined,
      });
      const name = `${stamp()}-${cast}-${who}-gag.png`;
      await commitFiles([{ path: `${WORK}/gags/${name}`, content: out }], `plates: composed gag ${name}`);
      return page("composed gag", out, [variant ? "" : `no ${who} speaker variant yet — used the base plate`].filter(Boolean), `${WORK}/gags/${name}`);
    }

    throw new PublishError(400, "step must be blank, approve, speaker, still or compose.");
  } catch (err) {
    const status = err instanceof PublishError ? err.status : 500;
    return NextResponse.json({ error: (err as Error).message }, { status });
  }
}
