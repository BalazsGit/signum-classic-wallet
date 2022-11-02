/**
 * @module BRS
*/

/* global $ */

import {
    init,
    setStateInterval,
    checkSelectedNode,
    getState,
    loadPage,
    goToPage,
    pageLoading,
    pageLoaded,
    addPagination,
    goToPageNumber,
    createDatabase,
    getAccountInfo,
    checkAssetDifferences,
    checkLocationHash,
    updateBlockchainDownloadProgress,
    checkIfOnAFork,
    checkMinimumFee,
    showFeeSuggestions
} from './brs'

import {
    pagesSettings,
    getSettings,
    updateSettings
} from './brs.settings'

import { theme } from './brs.theme'

import {
    setServerPassword,
    getServerPassword,
    sendOutsideRequest,
    sendRequest,
    processAjaxRequest,
    verifyAndSignTransactionBytes,
    broadcastTransactionBytes
} from './brs.server'

import {
    allowLoginViaEnter,
    showLoginOrWelcomeScreen,
    showLoginScreen,
    registerUserDefinedAccount,
    registerAccount,
    verifyGeneratedPassphrase,
    evAccountPhraseCustomPanelSubmit,
    loginCommon,
    evLoginButtonClick,
    showLockscreen,
    logout
} from './brs.login'

import { addEventListeners } from './brs.eventlisteners'

// import { addEvents } from './brs.addevents'
// import { pagesAliases } from './brs.aliases'

export const BRS = {
    server: '',
    state: {},
    blocks: [],
    genesis: '0',
    genesisRS: 'S-2222-2222-2222-22222',
    minimumFee: 0.01,

    // must match js/util/nxtaddress.js,
    rsRegEx: /^(BURST-|S-|TS-)([0-9A-Z]{3,5}-[0-9A-Z]{3,5}-[0-9A-Z]{3,5}-[0-9A-Z]{4,6})?(?:-([0-9A-Z]+))?$/,
    idRegEx: /^[0-9]{1,20}$/,

    account: '',
    accountRS: '',
    publicKey: '',
    accountInfo: {},

    database: null,
    databaseSupport: false,

    settings: {},
    contacts: {},

    isTestNet: false,
    prefix: 'S-',
    valueSuffix: 'SIGNA',

    lastBlockHeight: 0,
    downloadingBlockchain: false,

    rememberPassword: false,
    selectedContext: null,

    currentPage: 'dashboard',
    currentSubPage: '',
    pageNumber: 1,
    pageSize: 25,
    showPageNumbers: false,

    pages: {
        pagesSettings
    },
    incoming: {},

    hasLocalStorage: true,
    inApp: false,
    appVersion: '',
    appPlatform: '',
    assetTableKeys: [],

    loadingDotsHTML: '<span>.</span><span>.</span><span>.</span>',
    pendingTransactionHTML: '<i class="fas fa-spinner my-fa-spin"></i>',
    minimumFeeNumber: 0.01,

    stateInterval: 0,
    stateIntervalSeconds: 30,
    isScanning: false,

    nodes: [
        // First must be localhost mainnet!
        { address: 'http://localhost:8125', testnet: false },
        { address: 'https://uk.signum.network', testnet: false },
        { address: 'https://latam.signum.network', testnet: false },
        { address: 'https://us-east.signum.network', testnet: false },
        { address: 'https://singapore.signum.network', testnet: false },
        { address: 'https://australia.signum.network', testnet: false },
        { address: 'https://europe.signum.network', testnet: false },
        { address: 'https://brazil.signum.network', testnet: false },
        { address: 'https://europe1.signum.network', testnet: false },
        { address: 'https://europe2.signum.network', testnet: false },
        { address: 'https://canada.signum.network', testnet: false },
        { address: 'https://europe3.testnet.signum.network', testnet: true },
        { address: 'http://localhost:6876', testnet: true }
    ],

    // from brs.settings
    defaultSettings: {
        submit_on_enter: 0,
        news: -1,
        console_log: 0,
        fee_warning: '100000000000',
        amount_warning: '10000000000000',
        asset_transfer_warning: '10000',
        '24_hour_format': 1,
        remember_passphrase: 0,
        remember_account: 0,
        automatic_node_selection: 1,
        page_size: 25,
        prefered_node: '',
        language: 'en'
    },

    // from brs.server
    _password: '',
    multiQueue: null,

    // from login
    newlyCreatedAccount: false,

    // from brs.aliases
    alias_page_elements: 500,
    is_loading_aliases: false,
    prev_search_length: 0,

    // From brs.js
    init,
    setStateInterval,
    checkSelectedNode,
    getState,
    loadPage,
    goToPage,
    pageLoading,
    pageLoaded,
    addPagination,
    goToPageNumber,
    createDatabase,
    getAccountInfo,
    checkAssetDifferences,
    checkLocationHash,
    updateBlockchainDownloadProgress,
    checkIfOnAFork,
    checkMinimumFee,
    showFeeSuggestions,

    // From settings
    getSettings,
    updateSettings,

    // From theme
    theme,

    // From server
    setServerPassword,
    getServerPassword,
    sendOutsideRequest,
    sendRequest,
    processAjaxRequest,
    verifyAndSignTransactionBytes,
    broadcastTransactionBytes,

    // From login
    allowLoginViaEnter,
    showLoginOrWelcomeScreen,
    showLoginScreen,
    registerUserDefinedAccount,
    registerAccount,
    verifyGeneratedPassphrase,
    evAccountPhraseCustomPanelSubmit,
    loginCommon,
    evLoginButtonClick,
    showLockscreen,
    logout

    // From brs.addevents.js
    // addEvents
}

window.BRS = BRS

$(document).ready(function () {
    let done = 0
    const pages = [
        { location: 'body', path: 'html/header.html' },
        { location: 'body', path: 'html/sidebar_context.html' },
        { location: 'body', path: 'html/modals/account.html' },
        { location: 'body', path: 'html/modals/alias.html' },
        { location: 'body', path: 'html/modals/asset.html' },
        { location: 'body', path: 'html/modals/at_create.html' },
        { location: 'body', path: 'html/modals/block_info.html' },
        { location: 'body', path: 'html/modals/brs.html' },
        { location: 'body', path: 'html/modals/contact.html' },
        { location: 'body', path: 'html/modals/dividends.html' },
        { location: 'body', path: 'html/modals/escrow.html' },
        { location: 'body', path: 'html/modals/messages_decrypt.html' },
        { location: 'body', path: 'html/modals/raw_transaction.html' },
        { location: 'body', path: 'html/modals/request_burst_qr.html' },
        { location: 'body', path: 'html/modals/reward_assignment.html' },
        { location: 'body', path: 'html/modals/send_message.html' },
        { location: 'body', path: 'html/modals/send_money.html' },
        { location: 'body', path: 'html/modals/commitment.html' },
        { location: 'body', path: 'html/modals/subscription.html' },
        { location: 'body', path: 'html/modals/transaction_info.html' },
        { location: 'body', path: 'html/modals/transaction_operations.html' },
        { location: 'body', path: 'html/modals/user_info.html' },
        { location: 'body', path: 'html/modals/sign_message.html' },
        { location: '#lockscreen', path: 'html/pages/lockscreen.html' },
        { location: '#sidebar', path: 'html/sidebar.html' },
        { location: '#content', path: 'html/pages/dashboard.html' },
        { location: '#content', path: 'html/pages/transactions.html' },
        { location: '#content', path: 'html/pages/aliases.html' },
        { location: '#content', path: 'html/pages/messages.html' },
        { location: '#content', path: 'html/pages/contacts.html' },
        { location: '#content', path: 'html/pages/asset_exchange.html' },
        { location: '#content', path: 'html/pages/settings.html' },
        { location: '#content', path: 'html/pages/peers.html' },
        { location: '#content', path: 'html/pages/blocks.html' }
    ]
    function loadHTMLOn (domName, path) {
        $.get(path, '', (data) => {
            $(domName).prepend(data)
            $('#loading_bar').val(80 + (done / pages.length) * 20)
            ++done
            if (done === pages.length) {
                loadingDone()
            }
        })
    }
    function loadingDone () {
        addEventListeners()
        $('#loading_bar').val(100)
        BRS.init()
    }
    for (const page of pages) {
        loadHTMLOn(page.location, page.path)
    }
})
