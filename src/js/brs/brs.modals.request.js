/**
 * @depends {brs.js}
 */

/* global $ */

import { BRS } from '.'

export function evRequestBurstQrModalOnShowBsModal (e) {
    const radio = document.request_burst_form.request_burst_suggested_fee
    $('#new_qr_button').hide()
    $('#request_burst_immutable').prop('checked', true)
    $('#request_burst_account_id').val(String(BRS.accountRS).escapeHTML())

    const array = ['standard', 'cheap', 'priority']
    for (let i = 0; i < radio.length; i++) {
        radio[i].value = array[i]
        radio[i].onclick = function () {
            $('#request_burst_fee').val('')
            $('#request_burst_fee_div').toggleClass('has-error', false)
            $('#request_burst_fee_div').toggleClass('has-success', false)
        }
    }

    BRS.sendRequest('suggestFee', {
    }, function (response) {
        if (!response.errorCode) {
            $('#standard_fee_response').html("<span class='margin-left-5'>(<a href='#' class='btn-fee-response' name='fee_value' data-i18n='[title]click_to_apply'>" + (response.standard / 100000000).toFixed(8) + '</a>)</span>')
            $('#cheap_fee_response').html("<span class='margin-left-5'>(<a href='#' class='btn-fee-response' name='fee_value' data-i18n='[title]click_to_apply'>" + (response.cheap / 100000000).toFixed(8) + '</a>)</span>')
            $('#priority_fee_response').html("<span class='margin-left-5'>(<a href='#' class='btn-fee-response' name='fee_value' data-i18n='[title]click_to_apply'>" + (response.priority / 100000000).toFixed(8) + '</a>)</span>')
            $("[name='fee_value']").i18n() // apply locale to DOM after ajax call
            $("[name='fee_value']").on('click', function (e) {
                e.preventDefault()
                $('#request_burst_fee').val($(this).text())
            })
        } else {
            $('#suggested_fee_response').html(response.errorDescription)
            $("[name='suggested_fee_spinner']").addClass('suggested_fee_spinner_display_none')
        }
    })
}

export function evGenerateQrButtonClick (e) {
    e.preventDefault()
    const radio = document.request_burst_form.request_burst_suggested_fee
    const amount = Number($('#request_burst_amount').val())
    if (((!amount || amount < 0.00000001) && $('#request_burst_immutable').is(':checked')) || (amount && amount < 0.00000001)) {
        $('#request_burst_amount_div').toggleClass('has-success', false)
        $('#request_burst_amount_div').toggleClass('has-error', true)
        return
    } else {
        $('#request_burst_amount_div').toggleClass('has-error', false)
        $('#request_burst_amount_div').toggleClass('has-success', true)
    }
    const fee = Number($('#request_burst_fee').val())
    let suggested_fee
    for (let i = 0; i < radio.length; i++) {
        if (radio[i].checked == true) {
            suggested_fee = radio[i].value
        }
    }
    if ((!fee || fee < BRS.minimumFeeNumber) && !suggested_fee) {
        $('#request_burst_fee_div').toggleClass('has-success', false)
        $('#request_burst_fee_div').toggleClass('has-error', true)
        return
    } else {
        $('#request_burst_fee_div').toggleClass('has-error', false)
        $('#request_burst_fee_div').toggleClass('has-success', true)
    }
    const amountNQT = amount * 100000000
    const feeNQT = fee * 100000000
    const receiverId = BRS.accountRS
    let immutable
    if ($('#request_burst_immutable').is(':checked')) {
        immutable = '&immutable=true'
        $('#request_burst_immutable_response').html('Yes')
    } else {
        immutable = ''
        $('#request_burst_immutable_response').html('No')
    }
    if (suggested_fee) {
        $('#request_burst_qrcode_response').html(`<img src="${BRS.server}/burst?requestType=generateSendTransactionQRCode&receiverId=${receiverId}&amountNQT=${amountNQT}&feeSuggestionType=${suggested_fee}${immutable}"/>`)
        $('#request_burst_fee_response').html(suggested_fee.charAt(0).toUpperCase() + suggested_fee.slice(1))
    } else {
        $('#request_burst_qrcode_response').html(`<img src="${BRS.server}/burst?requestType=generateSendTransactionQRCode&receiverId=${receiverId}&amountNQT=${amountNQT}&feeNQT=${feeNQT}${immutable}"/>`)
        $('#request_burst_fee_response').html($('#request_burst_fee').val())
    }
    $('#generate_qr_button').hide()
    $('#new_qr_button').show()
    $('#cancel_button').html('Close')
    $('#request_burst_recipient_response').html(receiverId)
    if ($('#request_burst_amount').val()) {
        $('#request_burst_amount_response').html($('#request_burst_amount').val() + ' ' + BRS.valueSuffix)
    }
    $('#request_burst_div').removeClass('display-visible')
    $('#request_burst_div').addClass('display-none')
    $('#request_burst_response_div').removeClass('display-none')
    $('#request_burst_response_div').addClass('display-visible')
}
