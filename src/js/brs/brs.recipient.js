/**
 * @depends {brs.js}
 */

import { BRS } from '.'

import { NxtAddress } from '../util/nxtaddress'

import { sendRequest } from './brs.server'

import { getContactByName } from './brs.contacts'

import { getAccountIdFromPublicKey } from './brs.encryption'

import {
    convertToNQT,
    formatAmount,
    formatTimestamp,
    convertRSAccountToNumeric,
    getAccountFormatted
} from './brs.util'

export function automaticallyCheckRecipient () {
    const $recipientFields = $('#add_contact_account_id, #update_contact_account_id, #buy_alias_recipient, #escrow_create_recipient, #inline_message_recipient, #reward_recipient, #sell_alias_recipient, #send_message_recipient, #send_money_recipient, #subscription_cancel_recipient, #subscription_create_recipient, #transfer_alias_recipient, #transfer_asset_recipient, #transfer_asset_multi_recipient')

    $recipientFields.on('blur', function () {
        $(this).trigger('checkRecipient')
    })

    $recipientFields.on('checkRecipient', function () {
        const value = $(this).val()
        const form = $(this).closest('form')
        if (value) {
            checkRecipient(value, form)
        } else {
            form.find('.account_info').hide()
        }
    })

    $recipientFields.on('oldRecipientPaste', function () {})
}

export function sendMoneyCalculateTotal (element) {
    const current_amount = parseFloat($('#send_money_amount').val(), 10)
    const current_fee = parseFloat($('#send_money_fee').val(), 10)
    const fee = isNaN(current_fee) ? BRS.minimumFee : (current_fee < BRS.minimumFee ? BRS.minimumFee : current_fee)
    const amount = isNaN(current_amount) ? 0 : (current_amount < 0.00000001 ? 0 : current_amount)

    $('#send_money_fee').val(fee.toFixed(8))

    $(element).closest('.modal').find('.total_amount_ordinary').html(formatAmount(convertToNQT(amount + fee)) + ' ' + BRS.valueSuffix)
}

export function commitmentCalculateTotal (element) {
    const current_amount = parseFloat($('#commitment_amount').val(), 10)
    const current_fee = parseFloat($('#commitment_fee').val(), 10)
    const fee = isNaN(current_fee) ? BRS.minimumFee : (current_fee < BRS.minimumFee ? BRS.minimumFee : current_fee)
    const amount = isNaN(current_amount) ? 0 : (current_amount < 0.00000001 ? 0 : current_amount)

    $('#commitment_fee').val(fee.toFixed(8))

    $(element).closest('.modal').find('.total_amount_commitment').html(formatAmount(convertToNQT(amount + fee)) + ' ' + BRS.valueSuffix)
}

export function formsSendMoneyComplete (response, data) {
    if (!(data._extra && data._extra.convertedAccount) && !(data.recipient in BRS.contacts)) {
        $.notify($.t('success_send_money', { valueSuffix: BRS.valueSuffix }) + " <a href='#' data-account='" + getAccountFormatted(data, 'recipient') + "' data-toggle='modal' data-target='#add_contact_modal' style='text-decoration:underline'>" + $.t('add_recipient_to_contacts_q') + '</a>', {
            type: 'success'
        })
    } else {
        $.notify($.t('success_send_money', { valueSuffix: BRS.valueSuffix }), { type: 'success' })
    }
}

/** converts a recipient to accountId.
 * On error, returns ''. It means invalid rsAddress, or name not found in contacts
 */
function recipientToId (recipient) {
    let accountId = ''
    if (BRS.rsRegEx.test(recipient)) {
        accountId = convertRSAccountToNumeric(recipient)
    } else if (BRS.idRegEx.test(recipient)) {
        accountId = BigInt(recipient).toString(10)
    } else {
        const foundContact = getContactByName(recipient)
        if (foundContact) {
            accountId = foundContact.account
        }
    }
    return accountId
}

export function formsSendMoneyMulti (data) {
    data.recipients = ''
    let items = 0
    let biTotalAmount = 0n
    let rowAmountNQT

    let requestType = 'sendMoneyMulti'
    if (data.same_out_checkbox === '1') {
        requestType = 'sendMoneyMultiSame'
        try {
            rowAmountNQT = convertToNQT(data.amount_multi_out_same)
        } catch (e) {
            return { error: 'Invalid amount' }
        }
        data.amountNXT = data.amount_multi_out_same
        for (const recipient of data.recipient_multi_out_same) {
            if (recipient === '') continue
            const accountId = recipientToId(recipient)
            if (accountId === '') {
                return {
                    error: $.t('name_not_in_contacts', { name: recipient })
                }
            }
            if (items > 0) {
                data.recipients += ';'
            }
            items++
            if (items === 64) {
                return { error: $.t('error_max_recipients', { max: items }) }
            }
            data.recipients += accountId
            biTotalAmount += BigInt(rowAmountNQT)
        }
    } else {
        for (let i = 0; i < data.recipient_multi_out.length; i++) {
            if (data.recipient_multi_out[i] === '' ||
                    data.amount_multi_out[i] === '') {
                continue
            }
            const accountId = recipientToId(data.recipient_multi_out[i])
            if (accountId === '') {
                return {
                    error: $.t('name_not_in_contacts', { name: data.recipient_multi_out[i] })
                }
            }
            try {
                rowAmountNQT = convertToNQT(data.amount_multi_out[i])
            } catch (e) {
                return { error: 'Invalid amount' }
            }
            if (rowAmountNQT === '0') {
                return { error: 'Invalid amount' }
            }
            if (items > 0) {
                data.recipients += ';'
            }
            items++
            if (items === 128) {
                return { error: $.t('error_max_recipients', { max: items }) }
            }
            data.recipients += accountId + ':' + rowAmountNQT
            biTotalAmount += BigInt(rowAmountNQT)
        }
    }
    if (items < 2) {
        return { error: $.t('error_multi_out_minimum_recipients') }
    }
    const singleRecipients = new Set(data.recipients.split(';').map(item => item.split(':')[0]))
    if (singleRecipients.size !== items) {
        return { error: $.t('error_multi_out_duplicate_recipient') }
    }
    if (
        !BRS.showedFormWarning &&
            Number(BRS.settings.amount_warning) !== 0 &&
            biTotalAmount >= BigInt(BRS.settings.amount_warning)
    ) {
        BRS.showedFormWarning = true
        return {
            error: $.t('error_max_amount_warning', {
                burst: formatAmount(BRS.settings.amount_warning),
                valueSuffix: BRS.valueSuffix
            })
        }
    }

    delete data.same_out_checkbox
    delete data.amount_multi_out
    delete data.amount_multi_out_same
    delete data.recipient_multi_out
    delete data.recipient_multi_out_same

    return {
        requestType,
        data
    }
}

// BRS.sendMoneyShowAccountInformation(accountId) {
//     getAccountTypeAndMessage(accountId, function (response) {
//         if (response.type === 'success') {
//             $('#send_money_account_info').hide()
//         } else {
//             $('#send_money_account_info').html(response.message).show()
//         }
//     })
// }

function getAccountTypeAndMessage (accountId, callback) {
    // accountId sometimes comes with an RS-Address
    let sureItIsId = accountId
    if (BRS.rsRegEx.test(accountId)) {
        sureItIsId = convertRSAccountToNumeric(accountId)
        if (sureItIsId === '') {
            callback({
                type: 'danger',
                message: $.t('recipient_malformed'),
                account: null
            })
            return
        }
    }
    if (sureItIsId === '0') {
        callback({
            type: 'warning',
            message: $.t('recipient_burning_address'),
            account: null,
            noPublicKey: true
        })
        return
    }
    // first guess it is an AT
    sendRequest('getAT', {
        at: sureItIsId
    }, function (newResponse) {
        if (newResponse.errorCode === undefined) {
            callback({
                type: 'info',
                message: $.t('recipient_smart_contract', {
                    burst: formatAmount(newResponse.balanceNQT, false, true),
                    valueSuffix: BRS.valueSuffix
                }),
                account: newResponse,
                noPublicKey: true
            })
            return
        }

        // It is not an AT, get account
        sendRequest('getAccount', {
            account: sureItIsId
        }, function (response) {
            switch (response.errorCode) {
            case undefined:
                // expected right
                break
            case 4:
                callback({
                    type: 'danger',
                    message: $.t('recipient_malformed'),
                    account: null
                })
                return
            case 5:
                callback({
                    type: 'warning',
                    message: $.t('recipient_unknown_pka'),
                    account: null,
                    noPublicKey: true
                })
                return
            default:
                callback({
                    type: 'danger',
                    message: $.t('recipient_problem') + ' ' + String(response.errorDescription).escapeHTML(),
                    account: null
                })
                return
            }
            if (response.publicKey === undefined || response.publicKey === '0000000000000000000000000000000000000000000000000000000000000000') {
                callback({
                    type: 'warning',
                    message: $.t('recipient_no_public_key', {
                        burst: formatAmount(response.unconfirmedBalanceNQT, false, true),
                        valueSuffix: BRS.valueSuffix
                    }),
                    account: response,
                    noPublicKey: true
                })
                return
            }
            callback({
                type: 'info',
                message: $.t('recipient_info', {
                    burst: formatAmount(response.unconfirmedBalanceNQT, false, true),
                    valueSuffix: BRS.valueSuffix
                }),
                account: response
            })
        })
    })
}

export function correctAddressMistake (el) {
    $(el.target).closest('form').find('input[name=recipient],input[name=account_id]').val($(el.target).data('address')).trigger('blur')
}

function base36ToBase16 (inVal) {
    function convert (value) {
        return [...value.toString()]
            .reduce((r, v) => r * 36n + BigInt(parseInt(v, 36)), 0n)
    }
    return convert(inVal).toString(16)
}

export function checkRecipient (account, modal) {
    const classes = 'callout-info callout-danger callout-warning'

    const callout = modal.find('.account_info').first()
    const accountInputField = modal.find('input[name=converted_account_id]')
    const merchantInfoField = modal.find('input[name=merchant_info]')

    accountInputField.val('')
    merchantInfoField.val('')

    account = $.trim(account)

    const accountParts = BRS.rsRegEx.exec(account)
    if (accountParts !== null) {
        // Account seems to be RS Address
        const address = new NxtAddress(accountParts[2])
        if (address.isOk()) {
            // Account is RS Address
            if (accountParts[3] !== undefined) {
                // Account is extended RS Address. Verify the public key
                const publicKey = base36ToBase16(accountParts[3])
                const checkRS = getAccountIdFromPublicKey(publicKey, true)

                if (!checkRS.includes(accountParts[2])) {
                    // Public key does not match RS Address
                    callout.removeClass(classes).addClass('callout-danger').html($.t('recipient_malformed')).show()
                } else {
                    // Address verified
                    callout.removeClass(classes).addClass('callout-info').html($.t('recipient_info_extended')).show()
                }
            } else {
                // Account is RS Address and it isn't extended
                getAccountTypeAndMessage(address.getAccountId(), function (response) {
                    modal.find('input[name=recipientPublicKey]').val('')
                    modal.find('.recipient_public_key').hide()
                    if (response.account && response.account.description) {
                        checkForMerchant(response.account.description, modal)
                    }
                    // let message = response.message.escapeHTML();
                    callout.removeClass(classes).addClass('callout-' + response.type).html(response.message).show()
                })
            }
        } else {
            const guessedAddresses = address.getGuesses(BRS.prefix)
            // Account seems to be RS Address but there is an error
            if (guessedAddresses.length === 1) {
                // There is only one option of error correction suggestion.
                callout.removeClass(classes).addClass('callout-danger').html($.t('recipient_malformed_suggestion', {
                    recipient: `<span class='malformed_address' data-address='${guessedAddresses[0]}'>${address.formatGuess(guessedAddresses[0], account)}</span>`
                })).show()
            } else if (guessedAddresses.length > 1) {
                // There are many options of error correction suggestion.
                let html = $.t('recipient_malformed_suggestion', {
                    count: guessedAddresses.length
                }) + '<ul>'
                for (let i = 0; i < guessedAddresses.length; i++) {
                    html += `<li><span clas='malformed_address' data-address='${guessedAddresses[i]}'>${address.formatGuess(guessedAddresses[i], account)} </span></li>`
                }
                html += '</ul>'
                callout.removeClass(classes).addClass('callout-danger').html(html).show()
            } else {
                // There is no error correction suggestion
                callout.removeClass(classes).addClass('callout-danger').html($.t('recipient_malformed')).show()
            }
            callout.find('.malformed_address').on('click', correctAddressMistake)
        }
        return
    }
    if (BRS.idRegEx.test(account)) {
        // Account matches numeric ID
        getAccountTypeAndMessage(account, function (response) {
            callout.removeClass(classes).addClass('callout-' + response.type).html(response.message.escapeHTML()).show()
        })
        return
    }
    if (account.charAt(0) === '@') {
        // Suposed to be an alias
        checkRecipientAlias(account.substring(1), modal)
        return
    }
    let contact
    for (const rsAddress in BRS.contacts) {
        if (BRS.contacts[rsAddress].name === account) {
            contact = BRS.contacts[rsAddress]
            break
        }
    }
    if (contact) {
        getAccountTypeAndMessage(contact.account, function (response) {
            modal.find('input[name=recipientPublicKey]').val('')
            modal.find('.recipient_public_key').hide()
            if (response.account && response.account.description) {
                checkForMerchant(response.account.description, modal)
            }
            callout.removeClass(classes).addClass('callout-' + response.type).html($.t('contact_account_link', {
                account_id: getAccountFormatted(contact, 'account')
            }) + ' ' + response.message.escapeHTML()).show()
            if (response.type === 'info' || response.type === 'warning') {
                accountInputField.val(contact.accountRS)
            }
        })
        return
    }
    callout.removeClass(classes).addClass('callout-danger').html($.t('name_not_in_contacts', { name: account }) + ' ' + $.t('recipient_alias_suggestion')).show()
}

function checkRecipientAlias (account, modal) {
    const classes = 'callout-info callout-danger callout-warning'
    const callout = modal.find('.account_info').first()
    const accountInputField = modal.find('input[name=converted_account_id]')

    accountInputField.val('')

    sendRequest('getAlias', {
        aliasName: account
    }, function (response) {
        if (response.errorCode) {
            callout.removeClass(classes).addClass('callout-danger').html($.t('error_invalid_alias_name')).show()
        } else {
            if (response.aliasURI) {
                const alias = String(response.aliasURI)
                const timestamp = response.timestamp

                const regex_1 = /acct:(.*)@burst/
                const regex_2 = /nacc:(.*)/

                let match = alias.match(regex_1)

                if (!match) {
                    match = alias.match(regex_2)
                }

                if (match && match[1]) {
                    const address = new NxtAddress(String(match[1]).toUpperCase())
                    if (!address.isOk()) {
                        accountInputField.val('')
                        callout.html('Invalid account alias.')
                    }

                    getAccountTypeAndMessage(address.getAccountId(), function (response) {
                        modal.find('input[name=recipientPublicKey]').val('')
                        modal.find('.recipient_public_key').hide()
                        if (response.account && response.account.description) {
                            checkForMerchant(response.account.description, modal)
                        }

                        accountInputField.val(address.getAccountRS(BRS.prefix))
                        callout.html($.t('alias_account_link', {
                            account_id: address.getAccountRS(BRS.prefix)
                        }) + '.<br>' + $.t('alias_last_adjusted', {
                            timestamp: formatTimestamp(timestamp)
                        }) + '<br>' + response.message).removeClass(classes).addClass('callout-' + response.type).show()
                    })
                } else {
                    callout.removeClass(classes).addClass('callout-danger').html($.t('alias_account_no_link') + (!alias
                        ? $.t('error_uri_empty')
                        : $.t('uri_is', {
                            uri: String(alias).escapeHTML()
                        }))).show()
                }
            } else if (response.aliasName) {
                callout.removeClass(classes).addClass('callout-danger').html($.t('error_alias_empty_uri')).show()
            } else {
                callout.removeClass(classes).addClass('callout-danger').html(response.errorDescription ? $.t('error') + ': ' + String(response.errorDescription).escapeHTML() : $.t('error_alias')).show()
            }
        }
    })
}

function checkForMerchant (accountInfo, modal) {
    const requestType = modal.find('input[name=request_type]').val()

    if (requestType === 'sendMoney' || requestType === 'transferAsset') {
        if (accountInfo.match(/merchant/i)) {
            modal.find('input[name=merchant_info]').val(accountInfo)
            const checkbox = modal.find('input[name=add_message]')
            if (!checkbox.is(':checked')) {
                checkbox.prop('checked', true).trigger('change')
            }
        }
    }
}

export function evSpanRecipientSelectorClickButton (e) {
    if (!Object.keys(BRS.contacts).length) {
        e.preventDefault()
        e.stopPropagation()
        return
    }
    const $list = $(this).parent().find('ul')
    $list.empty()
    const names = []
    for (const accountId in BRS.contacts) {
        names.push(BRS.contacts[accountId].name)
    }
    names.sort((a, b) => {
        const nameA = a.toUpperCase()
        const nameB = b.toUpperCase()
        if (nameA < nameB) return -1
        if (nameA > nameB) return 1
        return 0
    })
    for (const name of names) {
        $list.append("<li><a href='#' data-contact='" + name.escapeHTML() + "'>" + name.escapeHTML() + '</a></li>')
    }
}

export function evSpanRecipientSelectorClickUlLiA (e) {
    e.preventDefault()
    $(this).closest('form').find('input[name=converted_account_id]').val('')
    $(this).closest('.input-group').find('input').not('[type=hidden]').val($(this).data('contact')).trigger('blur')
}
