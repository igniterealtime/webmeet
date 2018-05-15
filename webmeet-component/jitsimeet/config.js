var config = {

    hosts: {
        domain: location.hostname,
        muc: 'conference.' + location.hostname
    },

    bosh: 'wss://' + location.host + '/ws/',
    clientNode: 'webmeet',

    disableSuspendVideo: true,
    desktopSharingChromeExtId: null,
    desktopSharingChromeDisabled: true,
    desktopSharingChromeSources: [ 'screen', 'window', 'tab' ],
    desktopSharingChromeMinExtVersion: '0.1',
    desktopSharingFirefoxDisabled: false,

    channelLastN: -1,
    enableWelcomePage: true,
    minHDHeight: 540,
    enableUserRolesBasedOnToken: false,

    p2p: {
        enabled: true,
        stunServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
        ],
        preferH264: true
    },

    deploymentInfo: {

    }
};
