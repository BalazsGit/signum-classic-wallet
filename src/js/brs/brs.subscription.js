/**
 * @depends {brs.js}
 */
import { BRS } from '.'

export function pagesSubscription () {
    BRS.sendRequest('getAccountSubscriptions', {
        account: BRS.account
    }, function (response) {
        let rows = ''
        if (response.subscriptions && response.subscriptions.length) {
            for (let i = 0; i < response.subscriptions.length; i++) {
                rows += "<tr><td><a href='#' data-subscription='" + String(response.subscriptions[i].id).escapeHTML() + "'>" + String(response.subscriptions[i].id).escapeHTML() + '</a></td><td>' + String(response.subscriptions[i].senderRS).escapeHTML() + '</td><td>' + String(response.subscriptions[i].recipientRS).escapeHTML() + '</td><td>' + BRS.formatAmount(response.subscriptions[i].amountNQT) + '</td><td>' + response.subscriptions[i].frequency + '</td><td>' + BRS.formatTimestamp(response.subscriptions[i].timeNext) + '</td></tr>'
            }
        }
        BRS.dataLoaded(rows)
    })
}
