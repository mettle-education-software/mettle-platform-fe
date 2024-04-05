export const SIZE_EXTRA_SMALL = 576; // <576px
export const SIZE_SMALL = 768; // ≥576px  <768px
export const SIZE_MEDIUM = 992; // ≥768px <992px
export const SIZE_LARGE = 1200; // ≥992px <1200px
export const SIZE_EXTRA_LARGE = 1200; // ≥1200px <1400px
export const SIZE_EXTRA_EXTRA_LARGE = 1200; // ≥1400px
// Mobile-first Queries (think smallest first, add media queries to support larger devices):
export const smallAndBigger = `@media only screen and (min-width: ${SIZE_SMALL}px)`;
export const mediumAndBigger = `@media only screen and (min-width: ${SIZE_MEDIUM}px)`;
export const largeAndBigger = `@media only screen and (min-width: ${SIZE_LARGE}px)`;
export const extraLargeAndBigger = `@media only screen and (min-width: ${SIZE_EXTRA_LARGE}px)`;
export const extraExtraLargeAndBigger = `@media only screen and (min-width: ${SIZE_EXTRA_EXTRA_LARGE}px)`;
// Desktop-first Queries (think largest first, add media queries to support smaller devices):
// Note, we have to substract 1 for desktop-first queries to avoid collision with mobile-first queries.
// For example:
//   mobile first:   "min-width: 576px" means "≥576px" (includes 576)
//   desktop first:  "max-width: 575px" means "<576px" (excludes 576)
export const extraSmallAndSmaller = `@media only screen and (max-width: ${SIZE_EXTRA_SMALL - 1}px)`;
export const smallAndSmaller = `@media only screen and (max-width: ${SIZE_SMALL - 1}px)`;
export const mediumAndSmaller = `@media only screen and (max-width: ${SIZE_MEDIUM - 1}px)`;
export const largeAndSmaller = `@media only screen and (max-width: ${SIZE_LARGE - 1}px)`;
export const extraLargeAndSmaller = `@media only screen and (max-width: ${SIZE_EXTRA_LARGE - 1}px)`;
