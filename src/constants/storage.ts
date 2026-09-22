/** Centralized keys for sessionStorage and localStorage. */

export const STORAGE_KEYS = {
  /** Funnel assessment session ID (sessionStorage). */
  FUNNEL_SESSION_ID: "funnel_session_id",
  /** Funnel state persistence (sessionStorage). */
  FUNNEL_STATE: "funnel_state",
  /** Dismissed milestone banners on dashboard (sessionStorage). */
  DISMISSED_MILESTONES: "dismissed_milestones",
  /** Last daily check-in date per user, prevents repeat requests (localStorage). */
  LAST_CHECK_IN: "last_check_in",

  /** Declined upsell product keys (localStorage). */
  DECLINED_UPSELLS: "declined_upsells",
  /** UTM params from landing URL, first-touch per session (sessionStorage). */
  UTM_PARAMS: "utm_params",
  /** Affiliate tracking params from landing URL, first-touch per session (sessionStorage). */
  AFFILIATE_PARAMS: "affiliate_params",
  /** Funnel checkout session ID (sessionStorage). */
  CHECKOUT_SESSION_ID: "iqscale-session-id",
  /** Pending Life-Scale subscription offer id across checkout → thank-you. */
  LIFESCALE_OFFER_ID: "iqscale.lifescale.offerId",
  /** Pending Life-Scale upsell product offer id (funnel checkout → /upsell). */
  LIFESCALE_UPSELL_OFFER_ID: "iqscale.lifescale.upsellOfferId",
  /** Sirius customer reference saved by the checkout widget for one-click upsells. */
  LIFESCALE_CUSTOMER_ID: "ls_customer_id",
  /** Post-thank-you product path for homepage funnel. */
  LIFESCALE_SUCCESS_PATH: "iqscale.lifescale.successPath",
  /** Weakness report purchased during the funnel (sessionStorage). */
  FUNNEL_WEAKNESS_PURCHASED: "iqscale-weakness-purchased",
  /** Genius blueprint purchased during the funnel (sessionStorage). */
  FUNNEL_BLUEPRINT_PURCHASED: "iqscale-blueprint-purchased",
  /** Brain coach purchased during the funnel (sessionStorage). */
  FUNNEL_COACH_PURCHASED: "iqscale-coach-purchased",

  /** TikTok-only funnel session (session + localStorage). */
  TIKTOK_FUNNEL_SESSION: "tiktok_funnel_session",
  /** TikTok pixel id from ?pixel= (sessionStorage). */
  TIKTOK_PIXEL_ID: "tiktok_pixel_id",
  /** Meta pixel disabled for this ad session (session + localStorage). */
  META_DISABLED_SESSION: "meta_disabled_session",
  /** Deduped marketing Purchase / Payment Succeeded for imported funnels. */
  MARKETING_PURCHASE_TRACKED: "iqscale.marketing.purchase_tracked",
  /** Show descriptor acknowledgment on first report after initial subscription (sessionStorage). */
  DESCRIPTOR_ACK_NOTICE: "iqscale_descriptor_ack_notice",
} as const;
