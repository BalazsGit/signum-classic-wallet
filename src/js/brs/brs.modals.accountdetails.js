/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */

/* global $ BigInteger */

import { BRS } from '.'

import {
    formatAmount
} from './brs.util'

export function evAccountDetailsModalOnShowBsModal (e) {
    $('#account_details_modal_qr_code').empty().qrcode({
        text: BRS.accountRS,
        width: 128,
        height: 128
    })

    $('#account_details_modal_balance').show()

    if (BRS.accountInfo.errorCode && BRS.accountInfo.errorCode !== 5) {
        $('#account_balance_table').hide()
        // todo
        $('#account_balance_warning').html(String(BRS.accountInfo.errorDescription).escapeHTML()).show()
    } else {
        $('#account_balance_warning').hide()

        if (BRS.accountInfo.errorCode && BRS.accountInfo.errorCode === 5) {
            $('#account_balance_balance, #account_balance_unconfirmed_balance, #account_balance_effective_balance, #account_balance_guaranteed_balance').html('0 Signa')
            $('#account_balance_public_key').html(String(BRS.publicKey).escapeHTML())
            $('#account_balance_account_rs').html(String(BRS.accountRS).escapeHTML())
            $('#account_balance_account').html(String(BRS.account).escapeHTML())
        } else {
            $('#account_balance_balance').html(formatAmount(new BigInteger(BRS.accountInfo.balanceNQT)) + ' ' + BRS.valueSuffix)
            $('#account_balance_unconfirmed_balance').html(formatAmount(new BigInteger(BRS.accountInfo.unconfirmedBalanceNQT)) + ' ' + BRS.valueSuffix)
            $('#account_locked_balance').html(formatAmount((new BigInteger(BRS.accountInfo.balanceNQT) - new BigInteger(BRS.accountInfo.unconfirmedBalanceNQT)).toLocaleString()) + ' ' + BRS.valueSuffix)
            $('#account_committed_balance').html(formatAmount(new BigInteger(BRS.accountInfo.committedBalanceNQT)) + ' ' + BRS.valueSuffix)

            $('#account_balance_public_key').html(String(BRS.accountInfo.publicKey).escapeHTML())
            $('#account_balance_account_rs').html(String(BRS.accountInfo.accountRS).escapeHTML())
            $('#account_balance_account').html(String(BRS.account).escapeHTML())

            if (!BRS.accountInfo.publicKey) {
                $('#account_balance_public_key').html('/')
                $('#account_balance_warning').html($.t('no_public_key_warning') + ' ' + $.t('public_key_actions')).show()
            }
        }
    }
}
