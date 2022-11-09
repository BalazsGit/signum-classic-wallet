/**
 * @module BRS
*/

/* global $ SHA256_init SHA256_write SHA256_finalize */

import {
    init,
    setStateInterval,
    checkSelectedNode,
    autoSelectServer,
    getState,
    logoSidebarClick,
    loadPage,
    goToPage,
    pageLoading,
    pageLoaded,
    addPagination,
    goToPageNumber,
    createDatabase,
    clearData,
    getAccountInfo,
    checkLocationHash,
    updateBlockchainDownloadProgress,
    checkIfOnAFork,
    checkMinimumFee,
    showFeeSuggestions,
    evIdSearchSubmit
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

import {
    getBlock,
    handleInitialBlocks,
    handleNewBlocks,
    checkBlockHeight,
    incomingUpdateDashboardBlocks,
    pagesBlocksForged,
    pagesBlockInfo,
    blocksInfoLoad,
    pagesBlocks,
    incomingBlocks,
    finish100Blocks,
    blocksPageLoaded
} from './brs.blocks'

import {
    pagesAliases,
    evAliasModalOnShowBsModal,
    formsSellAlias,
    formsSellAliasComplete,
    evSellAliasClick,
    evBuyAliasModalOnShowBsModal,
    formsBuyAliasError,
    formsBuyAliasComplete,
    evRegisterAliasModalOnShowBsModal,
    incomingAliases,
    formsSetAlias,
    setAliasType,
    formsSetAliasError,
    formsSetAliasComplete,
    evAliasSearchSubmit,
    evAliasShowSearchResult
} from './brs.aliases'

import { pagesAt } from './brs.at'

import {
    showConsole,
    addToConsole
} from './brs.console'

import {
    getContactByName,
    pagesContacts,
    formsAddContact,
    evUpdateContactModalOnShowBsModal,
    formsUpdateContact,
    formsDeleteContact,
    exportContacts,
    importContacts
} from './brs.contacts'

import {
    generatePublicKey,
    getPublicKey,
    getAccountId,
    getAccountIdFromPublicKey,
    encryptNote,
    signBytes,
    verifyBytes,
    setEncryptionPassword,
    getEncryptionPassword,
    setDecryptionPassword,
    addDecryptedTransaction,
    tryToDecryptMessage,
    tryToDecrypt,
    removeDecryptionForm,
    decryptNoteFormSubmit,
    decryptAllMessages
} from './brs.encryption'

import { pagesEscrow } from './brs.escrow'

import {
    addMessageData,
    submitForm,
    formsAddCommitment,
    unlockForm
} from './brs.forms'

import {
    formatVolume,
    formatOrderPricePerWholeQNT,
    calculateOrderPricePerWholeQNT,
    calculatePricePerWholeQNT,
    calculateOrderTotalNQT,
    calculateOrderTotal,
    calculatePercentage,
    convertToNXT,
    amountToPrecision,
    convertToNQT,
    convertToQNTf,
    convertToQNT,
    format,
    formatQuantity,
    formatAmount,
    formatTimestamp,
    convertFromHex16,
    convertFromHex8,
    convertNumericToRSAccountFormat,
    convertRSAccountToNumeric,
    getAccountLink,
    getAssetLink,
    fullHashToId,
    getAccountTitle,
    getAccountFormatted,
    setupClipboardFunctionality,
    dataLoaded,
    dataLoadFinished,
    createInfoTable,
    getSelectedText,
    formatStyledAmount,
    getUnconfirmedTransactionsFromCache,
    hasTransactionUpdates,
    FnTree,
    translateServerError,
    getTranslatedFieldName
} from './brs.util'

import { addEventListeners } from './brs.eventlisteners'

import {
    pagesAssetExchange,
    loadCachedAssets,
    saveCachedAssets,
    getAssetDetails,
    cacheUserAssets,
    sortCachedAssets,
    bookmarkAllUserAssets,
    formsAddAssetBookmark,
    formsAddAssetBookmarkComplete,
    saveAssetBookmarks,
    positionAssetSidebar,
    incomingAssetExchange,
    evAssetExchangeSidebarClick,
    updateMiniTradeHistory,
    evAssetExchangeSearchInput,
    evAssetExchangeOrdersTableClick,
    evSellBuyAutomaticPriceClick,
    evAssetExchangeQuantityPriceKeydown,
    evCalculatePricePreviewKeyup,
    evAssetOrderModalOnShowBsModal,
    formsOrderAsset,
    formsOrderAssetComplete,
    formsIssueAsset,
    formsAssetExchangeChangeGroupName,
    evAssetExchangeSidebarContextClick,
    formsAssetExchangeGroup,
    pagesTransferHistory,
    pagesMyAssets,
    incomingMyAssets,
    evTransferAssetModalOnShowBsModal,
    formsTransferAssetMulti,
    formsTransferAsset,
    formsTransferAssetComplete,
    goToAsset,
    pagesOpenOrders,
    incomingOpenOrders,
    formsCancelOrder,
    formsCancelOrderComplete
} from './brs.assetexchange'

import {
    getInitialTransactions,
    getNewTransactions,
    getUnconfirmedTransactions,
    handleIncomingTransactions,
    incomingUpdateDashboardTransactions,
    addUnconfirmedTransaction,
    pagesTransactions,
    incomingTransactions,
    getTransactionDetails,
    evTransactionsPageTypeClick
} from './brs.transactions'

import {
    evSidebarContextOnContextmenu,
    closeContextMenu
} from './brs.sidebar'

import {
    pagesMessages,
    incomingMessages,
    evMessagesSidebarClick,
    evMessagesSidebarContextClick,
    evInlineMessageFormSubmit,
    formsSendMessageComplete,
    formsDecryptMessages
} from './brs.messages'

import {
    pagesPeers,
    incomingPeers
} from './brs.peers'

import {
    automaticallyCheckRecipient,
    sendMoneyCalculateTotal,
    commitmentCalculateTotal,
    formsSendMoneyComplete,
    formsSendMoneyMulti,
    correctAddressMistake,
    evSpanRecipientSelectorClickButton,
    evSpanRecipientSelectorClickUlLiA
} from './brs.recipient'

import {
    pagesSubscription
} from './brs.subscription'

import {
    setupLockableModal,
    evAddRecipientsClick,
    evDocumentOnClickRemoveRecipient,
    evMultiOutAmountChange,
    evMultiOutSameAmountChange,
    evSameOutCheckboxChange,
    evMultiOutFeeChange,
    evModalOnShowBsModal,
    resetModalMultiOut,
    evModalOnHiddenBsModal,
    showModalError,
    evAdvancedInfoClick
} from './brs.modals'

import {
    evAccountDetailsModalOnShowBsModal
} from './brs.modals.accountdetails'

import {
    formsSetAccountInfoComplete
} from './brs.modals.accountinfo'

import {
    showAccountModal,
    loadUserInfoModal
} from './brs.modals.account'

import {
    showRawTransactionModal,
    evTransactionOperationsModalClick,
    formsBroadcastTransactionComplete,
    formsParseTransactionComplete,
    formsParseTransactionError,
    formsCalculateFullHashComplete,
    formsCalculateFullHashError
} from './brs.modals.advanced'

import {
    evBlocksTableClick,
    showBlockModal
} from './brs.modals.block'

import {
    showEscrowDecisionModal,
    processEscrowDecisionModalData
} from './brs.modals.escrow'

import {
    evBrsModalOnShowBsModal
} from './brs.modals.info'

import {
    evRequestBurstQrModalOnShowBsModal,
    evGenerateQrButtonClick
} from './brs.modals.request'

import {
    formsSignModalButtonClicked,
    formsSignMessage,
    formsVerifyMessage
} from './brs.modals.signmessage'

import {
    showSubscriptionCancelModal,
    processSubscriptionCancelModalData
} from './brs.modals.subscription'

import {
    showTransactionModal
} from './brs.modals.transaction'

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
        settings: pagesSettings,
        blocks_forged: pagesBlocksForged,
        block_info: pagesBlockInfo,
        blocks: pagesBlocks,
        aliases: pagesAliases,
        at: pagesAt,
        contacts: pagesContacts,
        escrow: pagesEscrow,
        asset_exchange: pagesAssetExchange,
        transfer_history: pagesTransferHistory,
        my_assets: pagesMyAssets,
        open_orders: pagesOpenOrders,
        transactions: pagesTransactions,
        peers: pagesPeers,
        subscription: pagesSubscription,
        messages: pagesMessages
    },
    incoming: {
        updateDashboardBlocks: incomingUpdateDashboardBlocks,
        blocks: incomingBlocks,
        aliases: incomingAliases,
        asset_exchange: incomingAssetExchange,
        my_assets: incomingMyAssets,
        open_orders: incomingOpenOrders,
        updateDashboardTransactions: incomingUpdateDashboardTransactions,
        transactions: incomingTransactions,
        peers: incomingPeers,
        messages: incomingMessages
    },
    forms: {
        sellAlias: formsSellAlias,
        sellAliasComplete: formsSellAliasComplete,
        buyAliasError: formsBuyAliasError,
        buyAliasComplete: formsBuyAliasComplete,
        setAlias: formsSetAlias,
        setAliasError: formsSetAliasError,
        setAliasComplete: formsSetAliasComplete,
        addContact: formsAddContact,
        updateContact: formsUpdateContact,
        deleteContact: formsDeleteContact,
        addCommitment: formsAddCommitment,
        addAssetBookmark: formsAddAssetBookmark,
        addAssetBookmarkComplete: formsAddAssetBookmarkComplete,
        orderAsset: formsOrderAsset,
        orderAssetComplete: formsOrderAssetComplete,
        issueAsset: formsIssueAsset,
        assetExchangeChangeGroupName: formsAssetExchangeChangeGroupName,
        assetExchangeGroup: formsAssetExchangeGroup,
        transferAssetMulti: formsTransferAssetMulti,
        transferAsset: formsTransferAsset,
        transferAssetComplete: formsTransferAssetComplete,
        cancelOrder: formsCancelOrder,
        cancelOrderComplete: formsCancelOrderComplete,
        sendMoneyComplete: formsSendMoneyComplete,
        sendMoneyMulti: formsSendMoneyMulti,
        sendMessageComplete: formsSendMessageComplete,
        decryptMessages: formsDecryptMessages,
        setAccountInfoComplete: formsSetAccountInfoComplete,
        broadcastTransactionComplete: formsBroadcastTransactionComplete,
        parseTransactionComplete: formsParseTransactionComplete,
        parseTransactionError: formsParseTransactionError,
        calculateFullHashComplete: formsCalculateFullHashComplete,
        calculateFullHashError: formsCalculateFullHashError,
        signModalButtonClicked: formsSignModalButtonClicked,
        signMessage: formsSignMessage,
        verifyMessage: formsVerifyMessage
    },

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
    multiQueue: null,

    // from login
    newlyCreatedAccount: false,

    // from blocks
    tempBlocks: [],
    trackBlockchain: false,

    // from brs.aliases
    alias_page_elements: 500,
    is_loading_aliases: false,

    // from encryption
    _password: '',
    _decryptionPassword: '',
    _decryptedTransactions: {},
    _encryptedNote: null,
    _sharedKeys: {},
    _hash: {
        init: SHA256_init,
        update: SHA256_write,
        getBytes: SHA256_finalize
    },

    // from assetexchange
    assets: [],
    closedGroups: [],
    assetSearch: false,
    currentAsset: {},
    currentAssetID: 'undefined',

    // from transactions
    lastTransactions: '',
    unconfirmedTransactions: [],
    unconfirmedTransactionIds: '',
    unconfirmedTransactionsChange: true,
    transactionsPageType: null,

    // from messages
    _messages: {},
    _latestMessages: {},

    // from modals
    fetchingModalData: false,

    // from modals.account
    userInfoModal: {
        user: 0
    },

    // From brs.js
    init,
    setStateInterval,
    checkSelectedNode,
    autoSelectServer,
    getState,
    logoSidebarClick,
    loadPage,
    goToPage,
    pageLoading,
    pageLoaded,
    addPagination,
    goToPageNumber,
    createDatabase,
    clearData,
    getAccountInfo,
    checkLocationHash,
    updateBlockchainDownloadProgress,
    checkIfOnAFork,
    checkMinimumFee,
    showFeeSuggestions,
    evIdSearchSubmit,

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
    logout,

    // From blocks
    getBlock,
    handleInitialBlocks,
    handleNewBlocks,
    checkBlockHeight,
    blocksInfoLoad,
    finish100Blocks,
    blocksPageLoaded,

    // From aliases
    evAliasModalOnShowBsModal,
    evSellAliasClick,
    evBuyAliasModalOnShowBsModal,
    evRegisterAliasModalOnShowBsModal,
    setAliasType,
    evAliasSearchSubmit,
    evAliasShowSearchResult,

    // From console
    showConsole,
    addToConsole,

    // From contacts
    getContactByName,
    evUpdateContactModalOnShowBsModal,
    exportContacts,
    importContacts,

    // From encryption
    generatePublicKey,
    getPublicKey,
    getAccountId,
    getAccountIdFromPublicKey,
    encryptNote,
    signBytes,
    verifyBytes,
    setEncryptionPassword,
    getEncryptionPassword,
    setDecryptionPassword,
    addDecryptedTransaction,
    tryToDecryptMessage,
    tryToDecrypt,
    removeDecryptionForm,
    decryptNoteFormSubmit,
    decryptAllMessages,

    // From forms
    addMessageData,
    submitForm,
    unlockForm,

    // From util
    formatVolume,
    formatOrderPricePerWholeQNT,
    calculateOrderPricePerWholeQNT,
    calculatePricePerWholeQNT,
    calculateOrderTotalNQT,
    calculateOrderTotal,
    calculatePercentage,
    convertToNXT,
    amountToPrecision,
    convertToNQT,
    convertToQNTf,
    convertToQNT,
    format,
    formatQuantity,
    formatAmount,
    formatTimestamp,
    convertFromHex16,
    convertFromHex8,
    convertNumericToRSAccountFormat,
    convertRSAccountToNumeric,
    getAccountLink,
    getAssetLink,
    fullHashToId,
    getAccountTitle,
    getAccountFormatted,
    setupClipboardFunctionality,
    dataLoaded,
    dataLoadFinished,
    createInfoTable,
    getSelectedText,
    formatStyledAmount,
    getUnconfirmedTransactionsFromCache,
    hasTransactionUpdates,
    FnTree,
    translateServerError,
    getTranslatedFieldName,

    // From assetexchange
    loadCachedAssets,
    saveCachedAssets,
    getAssetDetails,
    cacheUserAssets,
    sortCachedAssets,
    bookmarkAllUserAssets,
    saveAssetBookmarks,
    positionAssetSidebar,
    incomingAssetExchange,
    evAssetExchangeSidebarClick,
    updateMiniTradeHistory,
    evAssetExchangeSearchInput,
    evAssetExchangeOrdersTableClick,
    evSellBuyAutomaticPriceClick,
    evAssetExchangeQuantityPriceKeydown,
    evCalculatePricePreviewKeyup,
    evAssetOrderModalOnShowBsModal,
    evAssetExchangeSidebarContextClick,
    evTransferAssetModalOnShowBsModal,
    goToAsset,

    // From transactions
    getInitialTransactions,
    getNewTransactions,
    getUnconfirmedTransactions,
    handleIncomingTransactions,
    addUnconfirmedTransaction,
    getTransactionDetails,
    evTransactionsPageTypeClick,

    // From recipient
    automaticallyCheckRecipient,
    sendMoneyCalculateTotal,
    commitmentCalculateTotal,
    correctAddressMistake,
    evSpanRecipientSelectorClickButton,
    evSpanRecipientSelectorClickUlLiA,

    // From messages
    evMessagesSidebarClick,
    evMessagesSidebarContextClick,
    evInlineMessageFormSubmit,

    // From sidebar
    evSidebarContextOnContextmenu,
    closeContextMenu,

    // From modals
    setupLockableModal,
    evAddRecipientsClick,
    evDocumentOnClickRemoveRecipient,
    evMultiOutAmountChange,
    evMultiOutSameAmountChange,
    evSameOutCheckboxChange,
    evMultiOutFeeChange,
    evModalOnShowBsModal,
    resetModalMultiOut,
    evModalOnHiddenBsModal,
    showModalError,
    evAdvancedInfoClick,

    // From modals.accountdetails
    evAccountDetailsModalOnShowBsModal,

    // From modals.account
    showAccountModal,
    loadUserInfoModal,

    // From modals.advanced
    showRawTransactionModal,
    evTransactionOperationsModalClick,

    // From modals.block
    evBlocksTableClick,
    showBlockModal,

    // From modals.escrow
    showEscrowDecisionModal,
    processEscrowDecisionModalData,

    // from modals.info
    evBrsModalOnShowBsModal,

    // From modals.request
    evRequestBurstQrModalOnShowBsModal,
    evGenerateQrButtonClick,

    // From modals.subscription
    showSubscriptionCancelModal,
    processSubscriptionCancelModalData,

    // From modals.transaction
    showTransactionModal
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
