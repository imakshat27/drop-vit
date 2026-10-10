import { renderFieldNotesPoster } from './share-poster-field-notes';
import { renderGraphicPoster } from './share-poster-graphic';
import type { ShareCard, ShareFormat } from './share-cards';
export type ShareEdition = 'field-notes' | 'flow' | 'signal';
/** All exports are rendered locally on the user's device. */
export async function renderSharePoster(
  card: ShareCard,
  format: ShareFormat,
  edition: ShareEdition = 'field-notes',
): Promise<Blob> {
  return edition === 'field-notes'
    ? renderFieldNotesPoster(card, format)
    : renderGraphicPoster(card, format, edition);
}
