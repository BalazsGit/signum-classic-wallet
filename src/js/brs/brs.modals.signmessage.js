/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */

/* global $ */

import converters from '../util/converters'
import { BRS } from '.'

export function formsSignModalButtonClicked () {
    if ($('#sign_message_nav').hasClass('active')) {
        BRS.forms.signMessage()
    } else {
        BRS.forms.verifyMessage()
    }
}

export function formsSignMessage () {
    const isHex = $('#sign_message_data_is_hex').is(':checked')
    let data = $('#sign_message_data').val()
    const passphrase = converters.stringToHexString($('#sign_message_passphrase').val())
    if (!isHex) data = converters.stringToHexString(data)
    BRS.sendRequest('parseTransaction', { transactionBytes: data }, function (result) {
        console.log(result)
        if (result.errorCode == null) {
            $('#sign_message_error').text('WARNING: YOU ARE SIGNING A TRANSACTION. IF YOU WERE NOT TRYING TO SIGN A TRANSACTION MANUALLY, DO NOT GIVE THIS SIGNATURE OUT. IT COULD ALLOW OTHERS TO SPEND YOUR FUNDS.')
            $('#sign_message_error').show()
        }
        const signature = BRS.signBytes(data, passphrase)
        $('#sign_message_output').text('Signature is ' + signature + '. Your public key is ' + BRS.getPublicKey(passphrase))
        $('#sign_message_output').show()
    }, false)
}

export function formsVerifyMessage () {
    const isHex = $('#verify_message_data_is_hex').is(':checked')
    let data = $('#verify_message_data').val()
    const signature = $.trim($('#verify_message_signature').val())
    const publicKey = $.trim($('#verify_message_public_key').val())
    if (!isHex) data = converters.stringToHexString(data)
    const result = BRS.verifyBytes(signature, data, publicKey)
    if (result) {
        $('#verify_message_error').hide()
        $('#verify_message_output').text('Signature is valid')
        $('#verify_message_output').show()
    } else {
        $('#verify_message_output').hide()
        $('#verify_message_error').text('Signature is invalid')
        $('#verify_message_error').show()
    }
}
