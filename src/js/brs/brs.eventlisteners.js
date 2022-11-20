/**
 * @depends {brs.js}
 */

/* global $ */

import { BRS } from '.'
import { fnAjaxMultiQueue } from './brs.ajaxmultiqueue'

import {
    autoSelectServer,
    getState,
    logoSidebarClick,
    loadPage,
    goToPage,
    goToPageNumber,
    clearData,
    showFeeSuggestions,
    evIdSearchSubmit
} from './brs'

import {
    updateSettings
} from './brs.settings'

import {
    showLoginOrWelcomeScreen,
    showLoginScreen,
    registerUserDefinedAccount,
    registerAccount,
    verifyGeneratedPassphrase,
    evAccountPhraseCustomPanelSubmit,
    evLoginButtonClick,
    logout
} from './brs.login'

import {
    blocksInfoLoad
} from './brs.blocks'

import {
    evAliasModalOnShowBsModal,
    evSellAliasClick,
    evBuyAliasModalOnShowBsModal,
    evRegisterAliasModalOnShowBsModal,
    setAliasType,
    evAliasSearchSubmit
} from './brs.aliases'

import {
    showConsole
} from './brs.console'

import {
    evUpdateContactModalOnShowBsModal,
    exportContacts,
    importContacts
} from './brs.contacts'

import {
    removeDecryptionForm,
    decryptNoteFormSubmit
} from './brs.encryption'

import {
    submitForm
} from './brs.forms'

import {
    convertToNQT,
    formatAmount,
    getAccountFormatted,
    FnTree
} from './brs.util'

import {
    sortCachedAssets,
    bookmarkAllUserAssets,
    saveAssetBookmarks,
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
    goToAsset
} from './brs.assetexchange'

import {
    evTransactionsPageTypeClick
} from './brs.transactions'

import {
    evSidebarContextOnContextmenu,
    closeContextMenu
} from './brs.sidebar'

import {
    evMessagesSidebarClick,
    evMessagesSidebarContextClick,
    evInlineMessageFormSubmit
} from './brs.messages'

import {
    sendMoneyCalculateTotal,
    commitmentCalculateTotal,
    evSpanRecipientSelectorClickButton,
    evSpanRecipientSelectorClickUlLiA
} from './brs.recipient'

import {
    setupLockableModal,
    evAddRecipientsClick,
    evMultiOutSameAmountChange,
    evSameOutCheckboxChange,
    evMultiOutFeeChange,
    evModalOnShowBsModal,
    resetModalMultiOut,
    evModalOnHiddenBsModal,
    evAdvancedInfoClick
} from './brs.modals'

import {
    evAccountDetailsModalOnShowBsModal
} from './brs.modals.accountdetails'

import {
    showAccountModal,
    loadUserInfoModal
} from './brs.modals.account'

import {
    evTransactionOperationsModalClick
} from './brs.modals.advanced'

import {
    evBlocksTableClick
} from './brs.modals.block'

import {
    showEscrowDecisionModal
} from './brs.modals.escrow'

import {
    evBrsModalOnShowBsModal
} from './brs.modals.info'

import {
    evRequestBurstQrModalOnShowBsModal,
    evGenerateQrButtonClick
} from './brs.modals.request'

import {
    showSubscriptionCancelModal
} from './brs.modals.subscription'

import {
    showTransactionModal
} from './brs.modals.transaction'

export function addEventListeners () {
    // from brs.js
    $('#prefered_node').on('blur', function () {
        getState(null)
    })
    $('#automatic_node_selection').change(function () {
        if (this.checked) {
            autoSelectServer()
            updateSettings('automatic_node_selection', 1)
        } else {
            updateSettings('automatic_node_selection', 0)
            getState(null)
        }
    })
    $('span.node_selector button').on('click', function (e) {
        const $list = $(this).parent().find('ul')
        $list.empty()
        if (BRS.settings.automatic_node_selection) {
            $list.append("<li class='divider'></li>")
            return
        }
        for (const server of BRS.nodes.filter(obj => obj.testnet === false)) {
            $list.append("<li><a href='#' data-server='" + server.address + "'>" + server.address + '</a></li>')
        }
        $list.append("<li class='divider'></li>")
        for (const server of BRS.nodes.filter(obj => obj.testnet === true)) {
            $list.append("<li><a href='#' data-server='" + server.address + "'>" + server.address + '</a></li>')
        }
    })
    $('span.node_selector').on('click', 'ul li a', function (e) {
        e.preventDefault()
        $(this).closest('div').find('input[name=prefered_node]').val('')
        $(this).closest('div').find('input[name=prefered_node]').val($(this).data('server')).trigger('blur')
    })
    $('#start_settings_language').on('change', function (e) {
        e.preventDefault()
        const value = $(this).val()
        updateSettings('language', value)
    })
    $('#logo, .sidebar-menu a').click(logoSidebarClick)
    $('button.goto-page, a.goto-page').click(function (event) {
        event.preventDefault()

        goToPage($(this).data('page'))
    })
    $('.data-pagination').on('click', 'a', function (e) {
        e.preventDefault()

        goToPageNumber($(this).data('page'))
    })
    $('#id_search').on('submit', evIdSearchSubmit)
    $('#login_button').on('click', evLoginButtonClick)

    // from brs.forms.js
    $('.modal form input').keydown(function (e) {
        if (e.which === '13') {
            e.preventDefault()
            if (BRS.settings.submit_on_enter && e.target.type !== 'textarea') {
                $(this).submit()
            } else {
                return false
            }
        }
    })
    $('.modal button.btn-primary:not([data-dismiss=modal]):not([data-ignore=true])').click(function () {
        submitForm($(this))
    })

    // from brs.login.js
    $('#account_phrase_custom_panel form').submit(evAccountPhraseCustomPanelSubmit)
    $('#menu_logout').on('click', function (event) {
        event.preventDefault()
        logout()
    })
    $('#menu_clear_data').on('click', function (event) {
        event.preventDefault()
        clearData()
    })

    // from brs.console.js
    $('#show_console a').on('click', function (event) {
        event.preventDefault()
        showConsole()
    })

    // found on lockscreen.html
    $('#lockscreen_register1, #lockscreen_register2').on('click', registerAccount)
    $('#lockscreen_registration_cancel').on('click', showLoginScreen)
    $('#lockscreen_registration_cancel2, #lockscreen_registration_cancel3, #lockscreen_registration_cancel4, #lockscreen_registration_cancel5').on('click', showLoginOrWelcomeScreen)
    $('#lockscreen_next').on('click', function (event) {
        $('.step_2').hide()
        $('.step_3').show()
    })
    $('#lockscreen_verify_passphrase').on('click', function (event) {
        event.preventDefault()
        verifyGeneratedPassphrase()
    })
    $('#lockscreen_user_defined_passphrase').on('click', function (event) {
        event.preventDefault()
        registerUserDefinedAccount()
    })

    // from brs.recipient.js
    $('#send_message_modal, #send_money_modal, #add_contact_modal').on('show.bs.modal', function (e) {
        const $invoker = $(e.relatedTarget)
        let account = $invoker.data('account')
        if (!account) {
            account = $invoker.data('contact')
        }
        if (account) {
            const $inputField = $(this).find('input[name=recipient], input[name=account_id]').not('[type=hidden]')
            $inputField.val(account).trigger('checkRecipient')
        }
        sendMoneyCalculateTotal($(this))
    })
    $('#commitment_modal').on('show.bs.modal', function (e) {
        const $invoker = $(e.relatedTarget)
        let account = $invoker.data('account')
        if (!account) {
            account = $invoker.data('contact')
        }
        if (account) {
            const $inputField = $(this).find('input[name=recipient], input[name=account_id]').not('[type=hidden]')
            $inputField.val(account).trigger('checkRecipient')
        }
        commitmentCalculateTotal($(this))
    })
    $('#commitment_amount, #commitment_fee').on('change', function (e) {
        commitmentCalculateTotal($(this))
    })
    $('#send_money_amount, #send_money_fee').on('change', function (e) {
        sendMoneyCalculateTotal($(this))
    })
    $('span.asset_selector button').on('click', function (e) {
        const $list = $(this).parent().find('ul')
        $list.empty()
        if (!BRS.accountInfo.assetBalances) {
            $list.append('<li>no-assets</li>')
            return
        }
        sortCachedAssets()
        for (const asset of BRS.assets) {
            const foundAsset = BRS.accountInfo.assetBalances.find((tkn) => tkn.asset === asset.asset)
            if (foundAsset) {
                $list.append(`<li><a href='#' data-name='${asset.name}' data-asset='${asset.asset}' data-decimals='${asset.decimals}'>${asset.name} - ${asset.asset}</a></li>`)
            }
        }
    })
    $('span.asset_selector').on('click', 'ul li a', evTransferAssetModalOnShowBsModal)
    $('span.recipient_selector').on('click', 'button', evSpanRecipientSelectorClickButton)
    $('span.recipient_selector').on('click', 'ul li a', evSpanRecipientSelectorClickUlLiA)

    // from brs.transactions.js
    $('input[type=radio][name=transactions_from_account]').on('click', function () {
        BRS.pageNumber = 1
        BRS.hasMorePages = false
        loadPage('transactions')
    })
    $('#transactions_page_type li a').click(evTransactionsPageTypeClick)

    // from brs.assetexchange.js
    $('#asset_exchange_bookmark_this_asset').on('click', function () {
        saveAssetBookmarks([BRS.currentAsset], function () {
            goToAsset(BRS.currentAsset.asset)
        })
    })
    $('#asset_exchange_add_all_assets_bookmark').on('click', function () {
        bookmarkAllUserAssets()
    })

    $('#asset_exchange_sidebar').on('click', 'a', evAssetExchangeSidebarClick)
    $('#ae_show_my_trades_only').on('change', updateMiniTradeHistory)
    $('#asset_exchange_search').on('submit', function (e) {
        e.preventDefault()
        $('#asset_exchange_search input[name=q]').trigger('input')
    })
    $('#asset_exchange_search input[name=q]').on('input', evAssetExchangeSearchInput)
    $('#asset_exchange_clear_search').on('click', function () {
        $('#asset_exchange_search input[name=q]').val('')
        $('#asset_exchange_search').trigger('submit')
    })
    $('#buy_asset_box .box-header, #sell_asset_box .box-header').click(function (e) {
        e.preventDefault()
        // Find the box parent
        const box = $(this).parents('.box').first()
        // Find the body and the footer
        const bf = box.find('.box-body, .box-footer')
        if (!box.hasClass('collapsed-box')) {
            box.addClass('collapsed-box')
            $(this).find('.btn i.fa').removeClass('fa-minus').addClass('fa-plus')
            bf.slideUp()
        } else {
            box.removeClass('collapsed-box')
            bf.slideDown()
            $(this).find('.btn i.fa').removeClass('fa-plus').addClass('fa-minus')
        }
    })
    $('#asset_exchange_bid_orders_table tbody, #asset_exchange_ask_orders_table tbody').on('click', 'td', evAssetExchangeOrdersTableClick)
    $('#sell_automatic_price, #buy_automatic_price').on('click', evSellBuyAutomaticPriceClick)
    $('#buy_asset_quantity, #buy_asset_price, #sell_asset_quantity, #sell_asset_price').keydown(evAssetExchangeQuantityPriceKeydown)
    $('#sell_asset_quantity, #sell_asset_price, #buy_asset_quantity, #buy_asset_price').keyup(evCalculatePricePreviewKeyup)
    $('#asset_order_modal').on('show.bs.modal', evAssetOrderModalOnShowBsModal)
    $('#asset_exchange_sidebar_group_context').on('click', 'a', function (e) {
        e.preventDefault()
        const groupName = BRS.selectedContext.data('groupname')
        const option = $(this).data('option')
        if (option == 'change_group_name') {
            $('#asset_exchange_change_group_name_old_display').html(groupName.escapeHTML())
            $('#asset_exchange_change_group_name_old').val(groupName)
            $('#asset_exchange_change_group_name_new').val('')
            $('#asset_exchange_change_group_name_modal').modal('show')
        }
    })
    $('#asset_exchange_sidebar_context').on('click', 'a', evAssetExchangeSidebarContextClick)
    $('#asset_exchange_group_group').on('change', function () {
        const value = $(this).val()
        if (value == -1) {
            $('#asset_exchange_group_new_group_div').show()
        } else {
            $('#asset_exchange_group_new_group_div').hide()
        }
    })
    $('#asset_exchange_group_modal').on('hidden.bs.modal', function (e) {
        $('#asset_exchange_group_new_group_div').val('').hide()
    })
    $('#transfer_asset_modal').on('show.bs.modal', evTransferAssetModalOnShowBsModal)
    $('body').on('click', 'a[data-goto-asset]', function (e) {
        e.preventDefault()
        const $visible_modal = $('.modal.in')
        if ($visible_modal.length) {
            $visible_modal.modal('hide')
        }
        goToAsset($(this).data('goto-asset'))
    })
    $('#cancel_order_modal').on('show.bs.modal', function (e) {
        const $invoker = $(e.relatedTarget)
        const orderType = $invoker.data('type')
        const orderId = $invoker.data('order')
        if (orderType == 'bid') {
            $('#cancel_order_type').val('cancelBidOrder')
        } else {
            $('#cancel_order_type').val('cancelAskOrder')
        }
        $('#cancel_order_order').val(orderId)
    })

    // from brs.messages.js
    $('#send_message_modal').on('show.bs.modal', function (e) {
        showFeeSuggestions('#send_message_fee', '#suggested_fee_response_send_message')
    })
    $('#suggested_fee_send_message').on('click', function (e) {
        e.preventDefault()
        showFeeSuggestions('#send_message_fee', '#suggested_fee_response_send_message')
    })
    $('#suggested_fee_messages_page').on('click', function (e) {
        e.preventDefault()
        showFeeSuggestions('#send_message_fee_page', '#suggested_fee_response_messages_page')
    })
    $('#messages_sidebar').on('click', 'a', evMessagesSidebarClick)
    $('#messages_sidebar_context').on('click', 'a', evMessagesSidebarContextClick)
    $('#messages_sidebar_update_context').on('click', 'a', function (e) {
        e.preventDefault()
        const account = getAccountFormatted(BRS.selectedContext.data('account'))
        const option = $(this).data('option')
        closeContextMenu()
        if (option == 'update_contact') {
            $('#update_contact_modal').modal('show')
        } else if (option == 'send_burst') {
            $('#send_money_recipient').val(BRS.selectedContext.data('contact')).trigger('blur')
            $('#send_money_modal').modal('show')
        }
    })
    $('body').on('click', 'a[data-goto-messages-account]', function (e) {
        e.preventDefault()
        const account = $(this).data('goto-messages-account')
        goToPage('messages', function () {
            $('#message_sidebar a[data-account=' + account + ']').trigger('click')
        })
    })
    $('#inline_message_form').submit(evInlineMessageFormSubmit)
    $('#message_details').on('click', 'dd.to_decrypt', function (e) {
        $('#messages_decrypt_modal').modal('show')
    })

    // from brs.aliases.js
    $('#transfer_alias_modal').on('show.bs.modal', function (e) {
        showFeeSuggestions('#transfer_alias_fee', '#suggested_fee_response_alias_transfer')
    })
    $('#suggested_fee_alias_transfer').on('click', function (e) {
        e.preventDefault()
        showFeeSuggestions('#transfer_alias_fee', '#suggested_fee_response_alias_transfer')
    })
    $('#sell_alias_modal').on('show.bs.modal', function (e) {
        showFeeSuggestions('#sell_alias_fee', '#suggested_fee_response_alias_sell')
    })
    $('#suggested_fee_alias_sell').on('click', function (e) {
        e.preventDefault()
        showFeeSuggestions('#sell_alias_fee', '#suggested_fee_response_alias_sell')
    })
    $('#buy_alias_modal').on('show.bs.modal', function (e) {
        showFeeSuggestions('#buy_alias_fee', '#suggested_fee_response_alias_buy')
    })
    $('#suggested_fee_alias_buy').on('click', function (e) {
        e.preventDefault()
        showFeeSuggestions('#buy_alias_fee', '#suggested_fee_response_alias_buy')
    })
    $('#transfer_alias_modal, #sell_alias_modal, #cancel_alias_sale_modal').on('show.bs.modal', evAliasModalOnShowBsModal)
    $('#sell_alias_to_specific_account, #sell_alias_to_anyone').on('click', evSellAliasClick)
    $('#buy_alias_modal').on('show.bs.modal', evBuyAliasModalOnShowBsModal)
    $('#register_alias_modal').on('show.bs.modal', evRegisterAliasModalOnShowBsModal)
    $('#register_alias_type').on('change', function () {
        const type = $(this).val()
        setAliasType(type, $('#register_alias_uri').val())
    })
    $('#alias_search').on('submit', evAliasSearchSubmit)

    // from brs.contacts.js
    $('#update_contact_modal').on('show.bs.modal', evUpdateContactModalOnShowBsModal)
    $('#delete_contact_modal').on('show.bs.modal', BRS.evDeleteContactModalOnShowBsModal)
    $('#export_contacts_button').on('click', function () {
        exportContacts()
    })
    $('#import_contacts_button_field').css({ display: 'none' })
    $('#import_contacts_button_field').on('change', function (button_event) {
        button_event.preventDefault()
        const file = $('#import_contacts_button_field')[0].files[0]
        const reader = new FileReader()
        reader.onload = function (read_event) {
            const imported_contacts = JSON.parse(read_event.target.result)
            importContacts(imported_contacts)
        }
        reader.readAsText(file)
        return false
    })
    $('#import_contacts_button').on('click', function () {
        $('#import_contacts_button_field').click()
    })

    // from brs.settings.js
    $('#settings_box select').on('change', function (e) {
        e.preventDefault()
        const key = $(this).attr('name')
        const value = $(this).val()
        updateSettings(key, value)
    })
    $('#settings_box input[type=text]').on('input', function (e) {
        const key = $(this).attr('name')
        let value = $(this).val()
        if (/_warning/i.test(key) && key !== 'asset_transfer_warning') {
            value = convertToNQT(value)
        }
        updateSettings(key, value)
    })

    // from brs.sidebar.js
    $('.sidebar_context').on('contextmenu', 'a', evSidebarContextOnContextmenu)

    // from brs.encryption.js
    $('#decrypt_note_form_container button.btn-primary').click(function () {
        decryptNoteFormSubmit()
    })
    $('#decrypt_note_form_container').on('submit', function (e) {
        e.preventDefault()
        decryptNoteFormSubmit()
    })

    // from brs.modals.js
    setupLockableModal()
    // Reset scroll position of tab when shown.
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
        const target = $(e.target).attr('href')
        $(target).scrollTop(0)
    })
    resetModalMultiOut()
    $('.ordinary-nav a').on('click', function (e) {
        $('#send_multi_out').hide()
        $('#send_ordinary').fadeIn()
        if (!$('.ordinary-nav').hasClass('active')) {
            $('.ordinary-nav').addClass('active')
        }
        if ($('.multi-out-nav').toggleClass('active')) {
            $('.multi-out-nav').removeClass('active')
        }
    })
    $('.multi-out-nav a').on('click', function (e) {
        $('#send_ordinary').hide()
        $('#send_multi_out').fadeIn()
        if ($('.ordinary-nav').hasClass('active')) {
            $('.ordinary-nav').removeClass('active')
        }
        if (!$('.multi-out-nav').hasClass('active')) {
            $('.multi-out-nav').addClass('active')
        }
    })
    $('#multi_out_same_amount').on('change', evMultiOutSameAmountChange)
    $('#send_money_same_out_checkbox').on('change', evSameOutCheckboxChange)
    $('#multi_out_fee').on('change', evMultiOutFeeChange)
    $('.transfer-asset-nav a').on('click', function (e) {
        $('.multi-transfer').hide()
        $('.transfer-asset').fadeIn()
        if (!$('.transfer-asset-nav').hasClass('active')) {
            $('.transfer-asset-nav').addClass('active')
        }
        if ($('.multi-transfer-nav').toggleClass('active')) {
            $('.multi-transfer-nav').removeClass('active')
        }
    })
    $('.multi-transfer-nav a').on('click', function (e) {
        $('.transfer-asset').hide()
        $('.multi-transfer').fadeIn()
        if ($('.transfer-asset-nav').hasClass('active')) {
            $('.transfer-asset-nav').removeClass('active')
        }
        if (!$('.multi-transfer-nav').hasClass('active')) {
            $('.multi-transfer-nav').addClass('active')
        }
    })
    $('.add_recipients').on('click', evAddRecipientsClick)
    $('.add_message').on('change', function (e) {
        if ($(this).is(':checked')) {
            $(this).closest('form').find('.optional_message').fadeIn()
            $(this).closest('.form-group').css('margin-bottom', '5px')
        } else {
            $(this).closest('form').find('.optional_message').hide()
            $(this).closest('.form-group').css('margin-bottom', '')
        }
    })
    $('.add_note_to_self').on('change', function (e) {
        if ($(this).is(':checked')) {
            $(this).closest('form').find('.optional_note').fadeIn()
        } else {
            $(this).closest('form').find('.optional_note').hide()
        }
    })
    $('.modal').on('show.bs.modal', evModalOnShowBsModal)
    $('.modal').on('shown.bs.modal', function () {
        $(this).find('input[type=text]:first, textarea:first, input[type=password]:first').not('[readonly]').first().focus()
        $(this).find('input[name=converted_account_id]').val('')
        BRS.showedFormWarning = false // maybe not the best place... we assume forms are only in modals?
    })
    $('.modal').on('hidden.bs.modal', evModalOnHiddenBsModal)
    $('input[name=feeNXT]').on('change', function () {
        const $modal = $(this).closest('.modal')
        const $feeInfo = $modal.find('.advanced_fee')
        if ($feeInfo.length) {
            $feeInfo.html(formatAmount(convertToNQT($(this).val())) + ' ' + BRS.valueSuffix)
        }
    })
    $('.advanced_info a').on('click', evAdvancedInfoClick)
    $('#reward_assignment_modal').on('show.bs.modal', function (e) {
        showFeeSuggestions('#reward_assignment_fee', '#suggested_fee_response_reward_assignment', '#reward_assignment_bottom_fee')
    })
    $('#reward_assignment_fee_suggested').on('click', function (e) {
        e.preventDefault()
        showFeeSuggestions('#reward_assignment_fee', '#suggested_fee_response_reward_assignment', '#reward_assignment_bottom_fee')
    })

    // from brs.modals.account.js
    $('#blocks_table, #blocks_forged_table, #contacts_table, #transactions_table, #dashboard_transactions_table, #asset_account, #asset_exchange_ask_orders_table, #transfer_history_table, #asset_exchange_bid_orders_table, #alias_info_table, .dgs_page_contents, .modal-content, #register_alias_modal, #block_info_table, #search_results_ul_container').on('click', 'a[data-user]', function (e) {
        e.preventDefault()
        const account = $(this).data('user')
        showAccountModal(account)
    })
    $('#user_info_modal').on('hidden.bs.modal', function (e) {
        $(this).find('.user_info_modal_content').hide()
        $(this).find('.user_info_modal_content table tbody').empty()
        $(this).find('.user_info_modal_content:not(.data-loading,.data-never-loading)').addClass('data-loading')
        $(this).find('ul.nav li.active').removeClass('active')
        $('#user_info_transactions').addClass('active')
        BRS.userInfoModal.user = 0
    })
    $('#user_info_modal ul.nav li').click(function (e) {
        e.preventDefault()
        const tab = $(this).data('tab')
        $(this).siblings().removeClass('active')
        $(this).addClass('active')
        $('.user_info_modal_content').hide()
        const content = $('#user_info_modal_' + tab)
        content.show()
        if (content.hasClass('data-loading')) {
            loadUserInfoModal(tab)
        }
    })

    // from brs.modals.accountdetails.js
    $('#account_details_modal').on('show.bs.modal', evAccountDetailsModalOnShowBsModal)
    $('#account_details_modal ul.nav li').click(function (e) {
        e.preventDefault()
        const tab = $(this).data('tab')
        $(this).siblings().removeClass('active')
        $(this).addClass('active')
        $('.account_details_modal_content').hide()
        const content = $('#account_details_modal_' + tab)
        content.show()
    })
    $('#account_details_modal').on('hidden.bs.modal', function (e) {
        $(this).find('.account_details_modal_content').hide()
        $(this).find('ul.nav li.active').removeClass('active')
        $('#account_details_balance_nav').addClass('active')
        $('#account_details_modal_qr_code').empty()
    })

    // from brs.modals.accountinfo.js
    $('#account_info_modal').on('show.bs.modal', function (e) {
        $('#account_info_name').val(BRS.accountInfo.name)
        $('#account_info_description').val(BRS.accountInfo.description)
        showFeeSuggestions('#account_info_fee', '#suggested_fee_response_account', '#account_info_bottom_fee')
    })
    $('#account_info_fee_suggested').on('click', function (e) {
        e.preventDefault()
        showFeeSuggestions('#account_info_fee', '#suggested_fee_response_account', '#account_info_bottom_fee')
    })

    // from brs.modals.advanced.js
    $('#transaction_operations_modal').on('show.bs.modal', function (e) {
        $(this).find('.output_table tbody').empty()
        $(this).find('.output').hide()
        $(this).find('.tab_content:first').show()
        $('#transaction_operations_modal_button').text($.t('broadcast')).data('resetText', $.t('broadcast')).data('form', 'broadcast_transaction_form')
    })
    $('#transaction_operations_modal').on('hidden.bs.modal', function (e) {
        $(this).find('.tab_content').hide()
        $(this).find('ul.nav li.active').removeClass('active')
        $(this).find('ul.nav li:first').addClass('active')

        $(this).find('.output_table tbody').empty()
        $(this).find('.output').hide()
    })
    $('#transaction_operations_modal ul.nav li').click(evTransactionOperationsModalClick)

    // from brs.modals.block.js
    $('#blocks_table, #blocks_forged_table, #dashboard_blocks_table').on('click', 'a[data-block]', evBlocksTableClick)

    // from brs.modals.escrow.js
    $('#escrow_table').on('click', 'a[data-escrow]', function (e) {
        e.preventDefault()
        const escrowId = $(this).data('escrow')
        showEscrowDecisionModal(escrowId)
    })

    // from brs.modals.info.js
    $('#brs_modal').on('show.bs.modal', evBrsModalOnShowBsModal)
    $('#brs_modal').on('hide.bs.modal', function (e) {
        $('body').off('dragover.brs, drop.brs')
        $('#brs_update_drop_zone, #brs_update_result, #brs_update_hashes, #brs_update_hash_progress').hide()
        $(this).find('ul.nav li.active').removeClass('active')
        $('#brs_modal_state_nav').addClass('active')
        $('.brs_modal_content').hide()
    })
    $('#brs_modal ul.nav li').click(function (e) {
        e.preventDefault()
        const tab = $(this).data('tab')
        $(this).siblings().removeClass('active')
        $(this).addClass('active')
        $('.brs_modal_content').hide()
        const content = $('#brs_modal_' + tab)
        content.show()
    })

    // from brs.modals.request.js
    $('#request_burst_qr_modal').on('show.bs.modal', evRequestBurstQrModalOnShowBsModal)
    $('#request_burst_amount').change(function () {
        const amount = Number($('#request_burst_amount').val())
        $('#request_burst_amount').val(amount)
        if (amount >= 0.00000001 || (!$('#request_burst_immutable').is(':checked') && (!amount || amount == 0))) {
            $('#request_burst_amount_div').toggleClass('has-error', false)
            $('#request_burst_amount_div').toggleClass('has-success', true)
        } else {
            $('#request_burst_amount_div').toggleClass('has-success', false)
            $('#request_burst_amount_div').toggleClass('has-error', true)
        }
    })
    $('#request_burst_fee').change(function () {
        const radio = document.request_burst_form.request_burst_suggested_fee
        const fee = Number($('#request_burst_fee').val())
        $('#request_burst_fee').val(fee)
        if (fee >= BRS.minimumFeeNumber) {
            for (let i = 0; i < radio.length; i++) {
                radio[i].checked = false
            }
            $('#request_burst_fee_div').toggleClass('has-error', false)
            $('#request_burst_fee_div').toggleClass('has-success', true)
        } else {
            $('#request_burst_fee_div').toggleClass('has-success', false)
            $('#request_burst_fee_div').toggleClass('has-error', true)
        }
    })
    $('#request_burst_immutable').change(function () {
        const amount = Number($('#request_burst_amount').val())
        if ($(this).is(':checked')) {
            if (amount >= 0.00000001) {
                $('#request_burst_amount_div').toggleClass('has-error', false)
                $('#request_burst_amount_div').toggleClass('has-success', true)
            } else {
                $('#request_burst_amount_div').toggleClass('has-success', false)
                $('#request_burst_amount_div').toggleClass('has-error', true)
            }
        } else {
            if (amount >= 0.00000001 || (!amount || amount == 0)) {
                $('#request_burst_amount_div').toggleClass('has-error', false)
                $('#request_burst_amount_div').toggleClass('has-success', true)
            } else {
                $('#request_burst_amount_div').toggleClass('has-success', false)
                $('#request_burst_amount_div').toggleClass('has-error', true)
            }
        }
    })
    $('#generate_qr_button').on('click', evGenerateQrButtonClick)
    $('#request_burst_qr_modal').on('hide.bs.modal', function (e) {
        $('#request_burst_div').removeClass('display-none')
        $('#request_burst_div').addClass('display-visible')
        $('#request_burst_response_div').removeClass('display-visible')
        $('#request_burst_response_div').addClass('display-none')
        $('#request_burst_amount_div').toggleClass('has-error', false)
        $('#request_burst_amount_div').toggleClass('has-success', false)
        $('#request_burst_fee_div').toggleClass('has-success', true)
        $('#request_burst_fee_div').toggleClass('has-error', false)
        const radio = document.request_burst_form.request_burst_suggested_fee
        for (let i = 0; i < radio.length; i++) {
            radio[i].checked = false
        }
        $('#cancel_button').html('Cancel')
        $('#generate_qr_button').show()
    })
    $('#new_qr_button').on('click', function (e) {
        $('#request_burst_div').removeClass('display-none')
        $('#request_burst_div').addClass('display-visible')
        $('#request_burst_response_div').removeClass('display-visible')
        $('#request_burst_response_div').addClass('display-none')
        $('#request_burst_amount_div').toggleClass('has-error', false)
        $('#request_burst_amount_div').toggleClass('has-success', false)
        $('#request_burst_fee_div').toggleClass('has-success', true)
        $('#request_burst_fee_div').toggleClass('has-error', false)
        $('#request_burst_amount').val('')
        $('#request_burst_fee').val(0.1)
        const radio = document.request_burst_form.request_burst_suggested_fee
        for (let i = 0; i < radio.length; i++) {
            radio[i].checked = false
        }
        $('#request_burst_immutable').prop('checked', true)
        $('#cancel_button').html('Cancel')
        $('#generate_qr_button').show()
        $('#new_qr_button').hide()
    })

    // from brs.modals.signmessage.js
    $('#sign_message_modal_button').click(BRS.forms.signModalButtonClicked)
    $('#sign_message_modal').on('show.bs.modal', function (e) {
        $('#sign_message_output, #verify_message_output').html('').hide()
        $('#sign_message_modal_sign_message').show()
        $('#sign_message_modal_button').text('Sign Message').data('form', 'sign_message_form')
    })
    $('#sign_message_modal ul.nav li').click(function (e) {
        e.preventDefault()
        const tab = $(this).data('tab')
        $(this).siblings().removeClass('active')
        $(this).addClass('active')
        $('.sign_message_modal_content').hide()
        const content = $('#sign_message_modal_' + tab)
        if (tab === 'sign_message') {
            $('#sign_message_modal_button').text('Sign Message').data('form', 'sign_message_form')
        } else {
            $('#sign_message_modal_button').text('Verify Message').data('form', 'verify_message_form')
        }
        $('#sign_message_modal .error_message').hide()
        content.show()
    })
    $('#sign_message_modal').on('hidden.bs.modal', function (e) {
        $(this).find('.sign_message_modal_content').hide()
        $(this).find('ul.nav li.active').removeClass('active')
        $('#sign_message_nav').addClass('active')
    })

    // from brs.modals.subscription.js
    $('#subscription_table').on('click', 'a[data-subscription]', function (e) {
        e.preventDefault()
        const subscriptionId = $(this).data('subscription')
        showSubscriptionCancelModal(subscriptionId)
    })

    // from brs.modals.transaction.js
    $('#transactions_table, #dashboard_transactions_table, #transfer_history_table, #asset_exchange_trade_history_table, #block_info_table, #block_info_transactions_table, #user_info_modal_transactions_table').on('click', 'a[data-transaction]', function (e) {
        e.preventDefault()
        const transactionId = $(this).data('transaction')
        showTransactionModal(transactionId)
    })
    $('#send_money_modal').on('show.bs.modal', function (e) {
        showFeeSuggestions('#send_money_fee', '#suggested_fee_response_ordinary')
        showFeeSuggestions('#multi_out_fee', '#suggested_fee_response_multi')
    })
    $('#commitment_modal').on('show.bs.modal', function (e) {
        showFeeSuggestions('#commitment_fee', '#suggested_fee_response_commitment')
    })
    $('#send_money_modal').on('hide.bs.modal', function (e) {
        $('#total_amount_multi_out').html('?')
    })
    $('#suggested_fee_ordinary').on('click', function (e) {
        e.preventDefault()
        showFeeSuggestions('#send_money_fee', '#suggested_fee_response_ordinary')
    })
    $('#suggested_fee_multi').on('click', function (e) {
        e.preventDefault()
        showFeeSuggestions('#multi_out_fee', '#suggested_fee_response_multi')
    })
    $('#transaction_info_modal').on('hide.bs.modal', function (e) {
        removeDecryptionForm($(this))
        $('#transaction_info_output_bottom, #transaction_info_output_top, #transaction_info_bottom').html('').hide()
    })

    // from brs.utils.js
    $.fn.tree = FnTree

    // from brs.ajaxmultiqueue
    $.ajaxMultiQueue = fnAjaxMultiQueue

    // from brs.blocks.js
    $('#block_info_latest_block').on('click', function (e) {
        e.preventDefault()
        blocksInfoLoad(BRS.blocks[0].height.toString())
    })
    $('#block_info_search').on('click', function (e) {
        const userInput = $('#block_info_input_block').val()
        const currentBlock = Number(userInput)
        if (isNaN(currentBlock) || currentBlock < 0) {
            $.notify($.t('invalid_blockheight'), { type: 'danger' })
        }
        blocksInfoLoad($('#block_info_input_block').val())
    })
    $('#block_info_previous_block').on('click', function (e) {
        const userInput = $('#block_info_input_block').val()
        const currentBlock = Number(userInput)
        if (isNaN(currentBlock) || currentBlock <= 0) {
            $.notify($.t('invalid_blockheight'), { type: 'danger' })
        }
        blocksInfoLoad(currentBlock - 1)
    })
    $('#block_info_next_block').on('click', function (e) {
        const userInput = $('#block_info_input_block').val()
        const currentBlock = Number(userInput)
        if (isNaN(currentBlock) || currentBlock < 0) {
            $.notify($.t('invalid_blockheight'), { type: 'danger' })
        }
        blocksInfoLoad(currentBlock + 1)
    })
}
