# Share cards

Drop share cards turn public builds and earned recognition into downloadable posters. Projects remain the primary objects; builder cards never rank people or show follower counts. Exporting an image does not publish it to a social account.

## Cards and placement

| Card         | What it says                                                                                 | Where it is available                                                          | Eligibility                                                                                              |
| ------------ | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------- |
| Build        | Project title, tagline, up to three tech tags and project URL; team credit in portrait/story | Approved project page; approved builds in My Workshop                          | Approved projects only                                                                                   |
| Builder      | Name, public bio, up to three skills and profile URL                                         | Public builder profile; owner's workshop profile shortcut                      | Public profile data only; no email address                                                               |
| Curator pick | Project title and “Curator pick”                                                             | Featured approved project; its workshop entry                                  | Existing featured flag; editorial selection, not a competition win                                       |
| Earned award | Exact recorded award title, project and associated period when available                     | Approved project page and its award aside; profile badges link to that project | Existing award record; period awards also require a matching locked historical period and title snapshot |

Share opens a preview dialog. Build cards describe the project; builder cards introduce a person without project names or project counts. Curator-pick cards communicate editorial selection. Earned-award cards reproduce recognition already recorded by Drop. Special awards can stand alone; period-based awards require a matching locked historical period and use the historical project title snapshot. Choose the card type and size, download a PNG, copy its caption or use the device share sheet when available. The download remains the fallback when a device cannot share files. Instagram and LinkedIn destinations depend on the user's device and installed apps.

Public-page captions use neutral attribution. Owner-dashboard build captions use first person; public shares remain neutral. No private submission status, curator feedback, account email, draft content or live support counts enter an export.

## Formats and visual direction

- Portrait: **1080 × 1350**, for a feed post.
- Story: **1080 × 1920**, with generous space around the main message for platform overlays.
- Square: **1080 × 1080**, for a compact post.

Use Drop's ink, cream, lilac and acid-lime palette: oversized typography, curved outlines, starbursts, orbit lines and a clear branded footer. The title and pitch remain readable at phone size; decorative shapes stay behind the content. Each format is composed independently so cropping does not hide the title or URL. The exported poster is static even when the surrounding website animates.

## Example posters and captions

**Patchwork and Ananya Rao below are fictional sample content. They are not real submissions or actual award winners.**

Build poster (sample):

> BUILT HERE · DROPPED WEEKLY  
> **PATCHWORK**  
> Your first open-source contribution, minus the overwhelm.  
> TYPESCRIPT · NEXT.JS · GITHUB API  
> Built by Arjun Mehta and team  
> droppp.tech/projects/patchwork

Public caption:

> Worth a look: Patchwork.
>
> Your first open-source contribution, minus the overwhelm.
> Built by Arjun Mehta and team.
>
> https://droppp.tech/projects/patchwork
>
> Built here. Dropped weekly. #Drop #StudentBuilders

Owner-dashboard build caption uses **“I’ve been building Patchwork.”** as the first line. Public captions include supplied team attribution; owner captions omit that extra line.

Builder poster (sample):

> MEET THE BUILDER  
> **ANANYA RAO**  
> Making useful things for campus life.  
> REACT · DESIGN · TYPESCRIPT  
> droppp.tech/builders/sample-ananya

Public caption:

> Meet Ananya Rao, a builder on Drop.
>
> Making useful things for campus life.
>
> https://droppp.tech/builders/sample-ananya
>
> Built here. Dropped weekly. #Drop #StudentBuilders

An owner builder caption, if enabled at its entry point, starts **“A little look at what I’m building.”**

Curator-pick poster uses the build composition with **CURATOR PICK** as the prominent badge. Its caption starts **“Patchwork is a curator pick on Drop.”**, followed by the sample tagline, project URL and the same branded closing line.

Award poster uses **[EXACT EARNED AWARD TITLE]**, **[RECORDED PERIOD, IF PRESENT]**, the eligible project title and project link. Its caption starts **“[Project title] earned [exact award title] · [period] on Drop.”**, omitting the separator and period for a special award with no period. The remaining paragraphs are the supplied description, project URL and **“Built here. Dropped weekly. #Drop #StudentBuilders”**. It must not invent a placement, period or winner designation absent from the record. No sample is presented as an actual earned award.

## Browser-only generation

The preview and PNG renderer load only when Share is opened. A browser Canvas draws the poster and exports it locally; the visitor's device performs the rendering. The server supplies the public data already used by the page. There is no server screenshot job, image-generation endpoint, AI service, uploaded export or stored generated image.

Use local typography and vector-like shapes for dependable export. Avoid depending on remote screenshots or avatars: cross-origin image restrictions can prevent Canvas export, and large downloads make sharing slower. File sharing requires an explicit user action; unsupported devices can download the PNG and copy the caption instead. Closing the dialog releases temporary object URLs and preview resources.

## Later

Weekly editorial carousels, scheduled social publishing and semester recaps are separate features. A weekly or monthly winners carousel must read finalized results and earned awards. A recap needs a defined reporting period and real historical milestones. Neither belongs in this share-card MVP, and neither should add image rendering to regular Cloudflare page requests.

## Remix edition

The share studio defaults to Remix, a second print-inspired edition using the original peach, lilac, lime and ink colours. Build cards use stacked sheets; builder cards use maker IDs; curator picks use a selection ticket; earned awards use a solid asterisk and ribbon. The Original edition remains available in the same studio, with a corrected solid logo and measured clear space. Both editions support portrait, story and square exports on the user's device. Changing editions adds no API calls, image storage or server rendering.

The header and footer now share a solid SVG brand asterisk with consistent spacing from the wordmark. Canvas posters also draw a solid centre and measure the word width before positioning the mark.
