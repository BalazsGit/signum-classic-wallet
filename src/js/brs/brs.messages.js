/**
 * @depends {brs.js}
 */

import converters from '../util/converters'
import hashicon from 'hashicon'

import { BRS } from '.'

import {
    reloadCurrentPage,
    pageLoaded
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
    formatAmount,
    formatTimestamp,
    convertFromHex16,
    convertFromHex8,
    getAccountTitle,
    getAccountFormatted,
    getUnconfirmedTransactionsFromCache,
    hasTransactionUpdates
} from './brs.util'

import {
    closeContextMenu
} from './brs.sidebar'

import {
    showAccountModal
} from './brs.modals.account'

export function pagesMessages (callback) {
    if (BRS.currentPage === 'messages' && BRS.currentSubPage) {
        // we will refresh current chat box
        const chatMessages = buildChatMessages(BRS.currentSubPage)

        $('#message_details').html(chatMessages)
        $('#message_details').scrollTop($('#message_details')[0].scrollHeight)
        $('#message_details .unlock-messages').on('click', function () {
            $('#messages_decrypt_modal').modal('show')
        })
        pageLoaded(callback)
        return
    }
    $('#messages_sidebar').empty()
    $('#no_message_selected').show()
    $('#no_messages_available').hide()
    $('#messages_card').hide()

    BRS._messages = {}

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
            displayMessageSidebar()
        } else {
            $('#no_message_selected').hide()
            $('#no_messages_available').show()
        }
        pageLoaded(callback)
    })
}

function displayMessageSidebar () {
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

        if (sortedMessage.userRS in BRS.contacts) {
            extra = " data-contact='" + getAccountTitle(sortedMessage, 'user') + "'"
        }

        rows += "<a href='#' class='list-group-item no-wrap' data-account='" + getAccountFormatted(sortedMessage, 'user') + "' data-account-id='" + getAccountFormatted(sortedMessage.user) + "'" + extra + '>' + getAccountTitle(sortedMessage, 'user') + '<br><small>' + formatTimestamp(sortedMessage.timestamp) + '</small></a>'
    }

    $('#messages_sidebar').empty().append(rows)

    if (BRS.currentSubPage) {
        $('#messages_sidebar a[data-account-id=' + BRS.currentSubPage + ']').addClass('active')
    }
}

export function incomingMessages (transactions) {
    if (!hasTransactionUpdates(transactions)) {
        return
    }
    let reloadContent = false
    let reloadSidebar = false
    const newUnconfMessages = transactions.filter(tx => tx.type === 1 && tx.subtype === 0 && tx.unconfirmed === true)
    if (newUnconfMessages.length > 0) {
        reloadContent = true
    }
    const newMessagesTransactions = transactions.filter(tx => tx.type === 1 && tx.subtype === 0 && tx.unconfirmed !== true && (tx.sender === BRS.account || tx.recipient === BRS.account))
    for (const trans of newMessagesTransactions) {
        const chatTo = trans.sender === BRS.account ? trans.recipient : trans.sender
        if (BRS._messages[chatTo] === undefined) {
            reloadSidebar = true
            BRS._messages[chatTo] = [trans]
        } else {
            if (BRS._messages[chatTo].find(tx => tx.transaction === trans.transaction)) {
                continue
            }
            BRS._messages[chatTo].push(trans)
            BRS._messages[chatTo].sort(function (a, b) {
                return a.timestamp - b.timestamp
            })
            reloadContent = true
        }
        if (trans.sender !== BRS.account) {
            $.notify($.t('you_received_message', {
                account: getAccountFormatted(trans, 'sender'),
                name: getAccountTitle(trans, 'sender')
            }), { type: 'success' })
        }
    }

    if (BRS.currentPage === 'messages') {
        if (reloadSidebar) {
            displayMessageSidebar()
        }
        if (reloadContent) {
            reloadCurrentPage()
        }
    }
}

const msgFromTemplate = `
<div class="direct-chat-msg %pendingClass%">
    <div class="direct-chat-infos clearfix">
        <span class="direct-chat-name float-left">%from%</span>
        <span class="direct-chat-timestamp float-right">%timestamp%</span>
    </div>
    <img class="direct-chat-img" src="%imgsrc%">
    <div class="direct-chat-text">%message%</div>
</div>`
const msgToTemplate = `
<div class="direct-chat-msg right %pendingClass%">
    <div class="direct-chat-infos clearfix">
        <span class="direct-chat-name float-right">%from%</span>
        <span class="direct-chat-timestamp float-left">%timestamp%</span>
    </div>
    <img class="direct-chat-img" src="%imgsrc%">
    <div class="direct-chat-text">%message%</div>
</div>`

function buildChatMessages (account_id) {
    let output = ''

    const messages = BRS._messages[account_id].slice(0)

    const unconfirmedTransactions = getUnconfirmedTransactionsFromCache(1, 0, {
        recipient: account_id,
        sender: account_id
    })

    if (unconfirmedTransactions) {
        messages.push(...unconfirmedTransactions.reverse())
    }

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
                    decoded = "<i class='fas fa-exclamation-triangle'></i> " + '<button class="btn btn-warning unlock-messages"><i class="fas fa-key"></i></button>'
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

            const day = formatTimestamp(messages[i].timestamp)

            let pendingClass = ''
            if (messages[i].unconfirmed === true) {
                pendingClass = 'messagePending'
            }
            if (messages[i].sender === BRS.account) {
                output += msgToTemplate
                    .replace('%pendingClass%', pendingClass)
                    .replace('%from%', $.t('you'))
                    .replace('%timestamp%', day)
                    .replace('%imgsrc%', hashicon(messages[i].sender, { size: 40 }).toDataURL())
                    .replace('%message%', decoded)
            } else {
                output += msgFromTemplate
                    .replace('%pendingClass%', pendingClass)
                    .replace('%from%', messages[i].senderRS)
                    .replace('%timestamp%', day)
                    .replace('%imgsrc%', hashicon(messages[i].sender, { size: 40 }).toDataURL())
                    .replace('%message%', decoded)
            }
        }
    }
    return output
}

export function evMessagesSidebarClick (e) {
    e.preventDefault()

    $('#messages_sidebar a.active').removeClass('active')
    $(this).addClass('active')

    const otherUser = $(this).data('account-id')
    BRS.currentSubPage = otherUser

    const contactName = $(this).data('contact')
    const rsAddress = $(this).data('account')
    const friendlyName = contactName ?? rsAddress
    $('#chatbox_title').html(friendlyName.escapeHTML())

    $('#no_message_selected, #no_messages_available').hide()
    $('#messages_card').hide()

    const chatMessages = buildChatMessages(otherUser)

    $('#message_details').html(chatMessages)
    $('#messages_card').show()
    $('#message_details').scrollTop($('#message_details')[0].scrollHeight)
    $('#message_details .unlock-messages').on('click', function () {
        $('#messages_decrypt_modal').modal('show')
    })
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })
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
        reloadCurrentPage()
    }
}

export function formsDecryptMessages (data) {
    const accountId = getAccountId(data.secretPhrase)
    if (accountId !== BRS.account) {
        return {
            error: $.t('error_passphrase_incorrect')
        }
    }
    if (data.rememberPassword) {
        setDecryptionPassword(data.secretPhrase)
        reloadCurrentPage()
        return {
            stop: true,
            hide: true
        }
    }
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

    if (success) {
        $.notify($.t('success_messages_decrypt'), { type: 'success' })
    } else {
        $.notify($.t('error_messages_decrypt'), { type: 'danger' })
    }

    reloadCurrentPage()

    return {
        stop: true,
        hide: true
    }
}
