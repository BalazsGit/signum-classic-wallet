/**
 * @depends {brs.js}
 */

import converters from '../util/converters'

import { BRS } from '.'

import {
    reloadCurrentPage,
    pageLoaded,
    showFeeSuggestions
} from './brs'

import {
    sendRequest
} from './brs.server'

import {
    getAccountId,
    setDecryptionPassword,
    addDecryptedTransaction,
    tryToDecryptMessage,
    decryptAllMessages
} from './brs.encryption'

import {
    addMessageData
} from './brs.forms'

import {
    formatAmount,
    formatTimestamp,
    convertFromHex16,
    convertFromHex8,
    getAccountTitle,
    getAccountFormatted,
    getUnconfirmedTransactionsFromCache,
    hasTransactionUpdates,
    translateServerError
} from './brs.util'

import {
    addUnconfirmedTransaction
} from './brs.transactions'

import {
    closeContextMenu
} from './brs.sidebar'

import {
    showAccountModal
} from './brs.modals.account'

export function pagesMessages (callback) {
    BRS._messages = {}

    $('.content.content-stretch:visible').width($('.page:visible').width())

    sendRequest('getAccountTransactions+', {
        account: BRS.account,
        firstIndex: 0,
        lastIndex: 74,
        type: 1,
        subtype: 0,
        includeIndirect: false
    }, function (response) {
        if (response.transactions && response.transactions.length) {
            for (let i = 0; i < response.transactions.length; i++) {
                const otherUser = (response.transactions[i].recipient === BRS.account ? response.transactions[i].sender : response.transactions[i].recipient)

                if (!(otherUser in BRS._messages)) {
                    BRS._messages[otherUser] = []
                }

                BRS._messages[otherUser].push(response.transactions[i])
            }

            displayMessageSidebar(callback)
        } else {
            $('#no_message_selected').hide()
            $('#no_messages_available').show()
            $('#messages_sidebar').empty()
            pageLoaded(callback)
        }
    })
}

function displayMessageSidebar (callback) {
    let activeAccount = false

    const $active = $('#messages_sidebar a.active')

    if ($active.length) {
        activeAccount = $active.data('account')
    }

    let rows = ''

    const sortedMessages = []

    for (const otherUser in BRS._messages) {
        BRS._messages[otherUser].sort(function (a, b) {
            if (a.timestamp > b.timestamp) {
                return 1
            } else if (a.timestamp < b.timestamp) {
                return -1
            } else {
                return 0
            }
        })

        const otherUserRS = (otherUser === BRS._messages[otherUser][0].sender ? BRS._messages[otherUser][0].senderRS : BRS._messages[otherUser][0].recipientRS)

        sortedMessages.push({
            timestamp: BRS._messages[otherUser][BRS._messages[otherUser].length - 1].timestamp,
            user: otherUser,
            userRS: otherUserRS
        })
    }

    sortedMessages.sort(function (a, b) {
        if (a.timestamp < b.timestamp) {
            return 1
        } else if (a.timestamp > b.timestamp) {
            return -1
        } else {
            return 0
        }
    })

    for (let i = 0; i < sortedMessages.length; i++) {
        const sortedMessage = sortedMessages[i]

        let extra = ''

        if (sortedMessage.user in BRS.contacts) {
            extra = " data-contact='" + getAccountTitle(sortedMessage, 'user') + "' data-context='messages_sidebar_update_context'"
        }

        rows += "<a href='#' class='list-group-item' data-account='" + getAccountFormatted(sortedMessage, 'user') + "' data-account-id='" + getAccountFormatted(sortedMessage.user) + "'" + extra + "><h4 class='list-group-item-heading'>" + getAccountTitle(sortedMessage, 'user') + "</h4><p class='list-group-item-text'>" + formatTimestamp(sortedMessage.timestamp) + '</p></a>'
    }

    $('#messages_sidebar').empty().append(rows)

    if (activeAccount) {
        $('#messages_sidebar a[data-account=' + activeAccount + ']').addClass('active').trigger('click')
    }

    pageLoaded(callback)
}

export function incomingMessages (transactions) {
    if (hasTransactionUpdates(transactions)) {
    // save current scrollTop
        let activeAccount = $('#messages_sidebar a.active')

        if (activeAccount.length) {
            activeAccount = activeAccount.data('account')
        } else {
            activeAccount = -1
        }
        if (transactions.length) {
            for (let i = 0; i < transactions.length; i++) {
                const trans = transactions[i]
                if (!trans.unconfirmed && trans.type === 1 && trans.subtype === 0 && trans.senderRS !== BRS.accountRS) {
                    if (trans.height >= BRS.lastBlockHeight - 3 && !BRS._latestMessages[trans.transaction]) {
                        BRS._latestMessages[trans.transaction] = trans
                        $.notify($.t('you_received_message', {
                            account: getAccountFormatted(trans, 'sender'),
                            name: getAccountTitle(trans, 'sender')
                        }), { type: 'success' })
                    }
                }
            }
        }

        if (BRS.currentPage === 'messages') {
            reloadCurrentPage()
        }
    }
}

export function evMessagesSidebarClick (e) {
    e.preventDefault()
    showFeeSuggestions('#send_message_fee_page', '#suggested_fee_response_messages_page')

    $('#messages_sidebar a.active').removeClass('active')
    $(this).addClass('active')

    const otherUser = $(this).data('account-id')

    $('#no_message_selected, #no_messages_available').hide()

    $('#inline_message_recipient').val(otherUser)
    $('#inline_message_form').show()

    let last_day = ''
    let output = "<dl class='chat'>"

    const messages = BRS._messages[otherUser]

    if (messages) {
        for (let i = 0; i < messages.length; i++) {
            let decoded = false
            let extra = ''
            const type = ''

            if (!messages[i].attachment) {
                decoded = $.t('message_empty')
            } else if (messages[i].attachment.encryptedMessage) {
                try {
                    decoded = tryToDecryptMessage(messages[i])
                    extra = 'decrypted'
                } catch (err) {
                    if (err.errorCode && err.errorCode === 1) {
                        decoded = $.t('error_decryption_passphrase_required')
                        extra = 'to_decrypt'
                    } else {
                        decoded = $.t('error_decryption_unknown')
                    }
                }
            } else {
                if (!messages[i].attachment['version.Message']) {
                    try {
                        decoded = converters.hexStringToString(messages[i].attachment.message)
                    } catch (err) {
                        // legacy
                        if (messages[i].attachment.message.indexOf('feff') === 0) {
                            decoded = convertFromHex16(messages[i].attachment.message)
                        } else {
                            decoded = convertFromHex8(messages[i].attachment.message)
                        }
                    }
                } else {
                    decoded = String(messages[i].attachment.message)
                }
            }

            if (decoded !== false) {
                if (!decoded) {
                    decoded = $.t('message_empty')
                }
                decoded = String(decoded).escapeHTML().nl2br()

                if (extra === 'to_decrypt') {
                    decoded = "<i class='fas fa-exclamation-triangle'></i> " + decoded
                } else if (extra === 'decrypted') {
                    if (type === 'payment') {
                        decoded = '<strong>+' + formatAmount(messages[i].amountNQT) + ' ' + BRS.valueSuffix + '</strong><br />' + decoded
                    }

                    decoded = "<i class='fas fa-lock'></i> " + decoded
                }
            } else {
                decoded = "<i class='fas fa-exclamation-triangle'></i> " + $.t('error_could_not_decrypt_message')
                extra = 'decryption_failed'
            }

            const day = formatTimestamp(messages[i].timestamp, true)

            if (day !== last_day) {
                output += '<dt><strong>' + day + '</strong></dt>'
                last_day = day
            }

            output += "<dd class='" + (messages[i].recipient === BRS.account ? 'from' : 'to') + (extra ? ' ' + extra : '') + "'><p>" + decoded + '</p></dd>'
        }
    }

    let unconfirmedTransactions = getUnconfirmedTransactionsFromCache(1, 0, {
        recipient: otherUser
    })

    if (!unconfirmedTransactions) {
        unconfirmedTransactions = []
    } else {
        unconfirmedTransactions = unconfirmedTransactions.reverse()
    }

    for (let i = 0; i < unconfirmedTransactions.length; i++) {
        const unconfirmedTransaction = unconfirmedTransactions[i]

        let decoded = false
        let extra = ''

        if (!unconfirmedTransaction.attachment) {
            decoded = $.t('message_empty')
        } else if (unconfirmedTransaction.attachment.encryptedMessage) {
            try {
                decoded = tryToDecryptMessage(unconfirmedTransaction)
                extra = 'decrypted'
            } catch (err) {
                if (err.errorCode && err.errorCode === 1) {
                    decoded = $.t('error_decryption_passphrase_required')
                    extra = 'to_decrypt'
                } else {
                    decoded = $.t('error_decryption_unknown')
                }
            }
        } else {
            if (!unconfirmedTransaction.attachment['version.Message']) {
                try {
                    decoded = converters.hexStringToString(unconfirmedTransaction.attachment.message)
                } catch (err) {
                    // legacy
                    if (unconfirmedTransaction.attachment.message.indexOf('feff') === 0) {
                        decoded = convertFromHex16(unconfirmedTransaction.attachment.message)
                    } else {
                        decoded = convertFromHex8(unconfirmedTransaction.attachment.message)
                    }
                }
            } else {
                decoded = String(unconfirmedTransaction.attachment.message)
            }
        }

        if (decoded === false) {
            decoded = "<i class='fas fa-exclamation-triangle'></i> " + $.t('error_could_not_decrypt_message')
            extra = 'decryption_failed'
        } else if (!decoded) {
            decoded = $.t('message_empty')
        }

        output += "<dd class='to tentative" + (extra ? ' ' + extra : '') + "'><p>" + (extra === 'to_decrypt' ? "<i class='fas fa-exclamation-triangle'></i> " : (extra === 'decrypted' ? "<i class='fas fa-lock'></i> " : '')) + String(decoded).escapeHTML().nl2br() + '</p></dd>'
    }

    output += '</dl>'

    $('#message_details').empty().append(output)
    $('#messages_page .content-splitter-right-inner').scrollTop($('#messages_page .content-splitter-right-inner')[0].scrollHeight)
}

export function evMessagesSidebarContextClick (e) {
    e.preventDefault()

    const account = getAccountFormatted(BRS.selectedContext.data('account'))
    const option = $(this).data('option')

    closeContextMenu()

    if (option === 'add_contact') {
        $('#add_contact_account_id').val(account).trigger('blur')
        $('#add_contact_modal').modal('show')
    } else if (option === 'send_burst') {
        $('#send_money_recipient').val(account).trigger('blur')
        $('#send_money_modal').modal('show')
    } else if (option === 'account_info') {
        showAccountModal(account)
    }
}

export function evInlineMessageFormSubmit (e) {
    e.preventDefault()

    let data = {
        recipient: $.trim($('#inline_message_recipient').val()),
        feeNXT: $('#send_message_fee_page').val(),
        deadline: '1440',
        secretPhrase: $.trim($('#inline_message_password').val())
    }

    if (!BRS.rememberPassword) {
        if ($('#inline_message_password').val() === '') {
            $.notify($.t('error_passphrase_required'), { type: 'danger' })
            return
        }

        const accountId = getAccountId(data.secretPhrase)

        if (accountId !== BRS.account) {
            $.notify($.t('error_passphrase_incorrect'), { type: 'danger' })
            return
        }
    }

    data.message = $.trim($('#inline_message_text').val())

    const $btn = $('#inline_message_submit')

    $btn.button('loading')

    const requestType = 'sendMessage'

    if ($('#inline_message_encrypt').is(':checked')) {
        data.encrypt_message = true
    }

    if (data.message) {
        try {
            data = addMessageData(data, 'sendMessage')
        } catch (err) {
            $.notify(String(err.message).escapeHTMl(), { type: 'danger' })
            return
        }
    } else {
        data._extra = {
            message: data.message
        }
    }

    sendRequest(requestType, data, function (response, input) {
        if (response.errorCode) {
            $.notify(translateServerError(response).escapeHTML(), { type: 'danger' })
        } else if (response.fullHash) {
            $.notify($.t('success_message_sent'), { type: 'success' })

            $('#inline_message_text').val('')

            if (data._extra.message && data.encryptedMessageData) {
                addDecryptedTransaction(response.transaction, {
                    encryptedMessage: String(data._extra.message)
                })
            }

            addUnconfirmedTransaction(response.transaction, function (alreadyProcessed) {
                if (!alreadyProcessed) {
                    $('#message_details dl.chat').append("<dd class='to tentative" + (data.encryptedMessageData ? ' decrypted' : '') + "'><p>" + (data.encryptedMessageData ? "<i class='fas fa-lock'></i> " : '') + (!data._extra.message ? $.t('message_empty') : String(data._extra.message).escapeHTML()) + '</p></dd>')
                    $('#messages_page .content-splitter-right-inner').scrollTop($('#messages_page .content-splitter-right-inner')[0].scrollHeight)
                }
            })

            // leave password alone until user moves to another page.
        } else {
            // TODO
            $.notify($.t('error_send_message'), { type: 'danger' })
        }
        $btn.button('reset')
    })
}

export function formsSendMessageComplete (response, data) {
    data.message = data._extra.message

    if (!(data._extra && data._extra.convertedAccount)) {
        $.notify($.t('success_message_sent') + " <a href='#' data-account='" + getAccountFormatted(data, 'recipient') + "' data-toggle='modal' data-target='#add_contact_modal' style='text-decoration:underline'>" + $.t('add_recipient_to_contacts_q') + '</a>', { type: 'success' })
    } else {
        $.notify($.t('success_message_sent'), { type: 'success' })
    }

    if (data.message && data.encryptedMessageData) {
        addDecryptedTransaction(response.transaction, {
            encryptedMessage: String(data._extra.message)
        })
    }

    if (BRS.currentPage === 'messages') {
        const date = new Date(Date.UTC(2013, 10, 24, 12, 0, 0, 0)).getTime()

        const now = parseInt(((new Date().getTime()) - date) / 1000, 10)

        const $sidebar = $('#messages_sidebar')

        const $existing = $sidebar.find('a.list-group-item[data-account=' + getAccountFormatted(data, 'recipient') + ']')

        if ($existing.length) {
            if (response.alreadyProcesed) {
                return
            }
            $sidebar.prepend($existing)
            $existing.find('p.list-group-item-text').html(formatTimestamp(now))

            const isEncrypted = (!!data.encryptedMessageData)

            if ($existing.hasClass('active')) {
                $('#message_details dl.chat').append("<dd class='to tentative" + (isEncrypted ? ' decrypted' : '') + "'><p>" + (isEncrypted ? "<i class='fas fa-lock'></i> " : '') + (data.message ? data.message.escapeHTML() : $.t('message_empty')) + '</p></dd>')
            }
        } else {
            const accountTitle = getAccountTitle(data, 'recipient')

            let extra = ''

            if (accountTitle !== data.recipient) {
                extra = " data-context='messages_sidebar_update_context'"
            }

            const listGroupItem = "<a href='#' class='list-group-item' data-account='" + getAccountFormatted(data, 'recipient') + "'" + extra + "><h4 class='list-group-item-heading'>" + accountTitle + "</h4><p class='list-group-item-text'>" + formatTimestamp(now) + '</p></a>'
            $('#messages_sidebar').prepend(listGroupItem)
        }
        $('#messages_page .content-splitter-right-inner').scrollTop($('#messages_page .content-splitter-right-inner')[0].scrollHeight)
    }
}

export function formsDecryptMessages (data) {
    let success = false
    try {
        const messagesToDecrypt = []
        for (const otherUser in BRS._messages) {
            for (const key in BRS._messages[otherUser]) {
                const message = BRS._messages[otherUser][key]
                if (message.attachment && message.attachment.encryptedMessage) {
                    messagesToDecrypt.push(message)
                }
            }
        }

        const unconfirmedMessages = getUnconfirmedTransactionsFromCache(1, 0)
        if (unconfirmedMessages) {
            for (const unconfirmedMessage of unconfirmedMessages) {
                if (unconfirmedMessage.attachment && unconfirmedMessage.attachment.encryptedMessage) {
                    messagesToDecrypt.push(unconfirmedMessage)
                }
            }
        }

        success = decryptAllMessages(messagesToDecrypt, data.secretPhrase)
    } catch (err) {
        if (err.errorCode && err.errorCode <= 2) {
            return {
                error: err.message.escapeHTML()
            }
        } else {
            return {
                error: $.t('error_messages_decrypt')
            }
        }
    }

    if (data.rememberPassword) {
        setDecryptionPassword(data.secretPhrase)
    }

    $('#messages_sidebar a.active').trigger('click')

    if (success) {
        $.notify($.t('success_messages_decrypt'), { type: 'success' })
    } else {
        $.notify($.t('error_messages_decrypt'), { type: 'danger' })
    }

    return {
        stop: true
    }
}
