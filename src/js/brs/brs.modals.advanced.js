/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */

import { createInfoTable } from './brs.util'

export function showRawTransactionModal (transaction) {
    $('#raw_transaction_modal_unsigned_transaction_bytes').val(transaction.unsignedTransactionBytes)
    $('#raw_transaction_modal_transaction_bytes').val(transaction.transactionBytes)

    if (transaction.fullHash) {
        $('#raw_transaction_modal_full_hash').val(transaction.fullHash)
        $('#raw_transaction_modal_full_hash_container').show()
    } else {
        $('#raw_transaction_modal_full_hash_container').hide()
    }

    if (transaction.signatureHash) {
        $('#raw_transaction_modal_signature_hash').val(transaction.signatureHash)
        $('#raw_transaction_modal_signature_hash_container').show()
    } else {
        $('#raw_transaction_modal_signature_hash_container').hide()
    }

    $('#raw_transaction_modal').modal('show')
}

export function formsBroadcastTransactionComplete (response, data) {
    $('#parse_transaction_form').find('.error_message').hide()
    $('#transaction_operations_modal').modal('hide')
}

export function formsParseTransactionComplete (response, data) {
    $('#parse_transaction_form').find('.error_message').hide()
    $('#parse_transaction_output_table tbody').empty().append(createInfoTable(response, true))
    $('#parse_transaction_output').show()
}

export function formsParseTransactionError () {
    $('#parse_transaction_output_table tbody').empty()
    $('#parse_transaction_output').hide()
}

export function formsCalculateFullHashComplete (response, data) {
    $('#calculate_full_hash_form').find('.error_message').hide()
    $('#calculate_full_hash_output_table tbody').empty().append(createInfoTable(response, true))
    $('#calculate_full_hash_output').show()
}

export function formsCalculateFullHashError () {
    $('#calculate_full_hash_output_table tbody').empty()
    $('#calculate_full_hash_output').hide()
}
