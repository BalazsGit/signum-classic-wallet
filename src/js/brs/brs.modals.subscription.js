/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */

/* global $ */

import { BRS } from '.'

export function showSubscriptionCancelModal (subscription) {
    if (BRS.fetchingModalData) {
        return
    }

    BRS.fetchingModalData = true

    if (typeof subscription !== 'object') {
        BRS.sendRequest('getSubscription', {
            subscription
        }, function (response, input) {
            BRS.processSubscriptionCancelModalData(response)
        })
    } else {
        BRS.processSubscriptionCancelModalData(subscription)
    }
}

export function processSubscriptionCancelModalData (subscription) {
    $('#subscription_cancel_subscription').val(subscription.id)
    $('#subscription_cancel_sender').html(subscription.senderRS)
    $('#subscription_cancel_recipient').html(subscription.recipientRS)
    $('#subscription_cancel_amount').html(BRS.formatAmount(subscription.amountNQT))
    $('#subscription_cancel_frequency').html(subscription.frequency)
    $('#subscription_cancel_time_next').html(BRS.formatTimestamp(subscription.timeNext))

    $('#subscription_cancel_modal').modal('show')
    BRS.fetchingModalData = false
}
