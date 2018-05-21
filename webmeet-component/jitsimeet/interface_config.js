var interfaceConfig = {
    DEFAULT_BACKGROUND: '#474747',
    DESKTOP_SHARING_BUTTON_DISABLED_TOOLTIP: null,
    INITIAL_TOOLBAR_TIMEOUT: 20000,
    TOOLBAR_TIMEOUT: 4000,
    DEFAULT_REMOTE_DISPLAY_NAME: 'Participant',
    DEFAULT_LOCAL_DISPLAY_NAME: 'me',
    SHOW_JITSI_WATERMARK: false,
    JITSI_WATERMARK_LINK: 'http://igniterealtime.org',

    SHOW_WATERMARK_FOR_GUESTS: false,
    SHOW_BRAND_WATERMARK: false,
    BRAND_WATERMARK_LINK: '',
    SHOW_POWERED_BY: false,
    SHOW_DEEP_LINKING_IMAGE: false,
    GENERATE_ROOMNAMES_ON_WELCOME_PAGE: true,
    DISPLAY_WELCOME_PAGE_CONTENT: true,
    APP_NAME: 'WebMeet',
    NATIVE_APP_NAME: 'WebMeet',
    LANG_DETECTION: false, // Allow i18n to detect the system language
    INVITATION_POWERED_BY: true,

    AUTHENTICATION_ENABLE: true,
    TOOLBAR_BUTTONS: [

        // main toolbar
        'microphone', 'camera', 'desktop', 'fullscreen', 'fodeviceselection', 'hangup',

        // extended toolbar
        'profile', 'chat',
        'sharedvideo', 'settings', 'raisehand', 'videoquality', 'filmstrip',
        'invite', 'feedback', 'stats', 'shortcuts'
    ],

    SETTINGS_SECTIONS: [ 'language', 'devices', 'moderator' ],

    VIDEO_LAYOUT_FIT: 'both',
    filmStripOnly: false,
    VERTICAL_FILMSTRIP: true,

    CLOSE_PAGE_GUEST_HINT: false,
    RANDOM_AVATAR_URL_PREFIX: false,
    RANDOM_AVATAR_URL_SUFFIX: false,
    FILM_STRIP_MAX_HEIGHT: 120,

    ENABLE_FEEDBACK_ANIMATION: false,
    DISABLE_FOCUS_INDICATOR: false,
    DISABLE_DOMINANT_SPEAKER_INDICATOR: false,

    DISABLE_RINGING: false,
    AUDIO_LEVEL_PRIMARY_COLOR: 'rgba(255,255,255,0.4)',
    AUDIO_LEVEL_SECONDARY_COLOR: 'rgba(255,255,255,0.2)',
    POLICY_LOGO: null,
    LOCAL_THUMBNAIL_RATIO: 16 / 9, // 16:9
    REMOTE_THUMBNAIL_RATIO: 1, // 1:1

    LIVE_STREAMING_HELP_LINK: 'https://jitsi.org/live',
    MOBILE_APP_PROMO: false,
    MAXIMUM_ZOOMING_COEFFICIENT: 1.3,
    SUPPORT_URL: 'https://github.com/jitsi/jitsi-meet/issues/new',
    CONNECTION_INDICATOR_AUTO_HIDE_ENABLED: true,
    CONNECTION_INDICATOR_AUTO_HIDE_TIMEOUT: 5000,
    VIDEO_QUALITY_LABEL_DISABLED: false,

    _BACKGROUND_BLUR: 'off'
};
