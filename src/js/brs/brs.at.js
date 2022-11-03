/**
 * @depends {brs.js}
 */
import { BRS } from '.'

export function pagesAt () {
    BRS.sendRequest('getAccountATs', {
        account: BRS.account
    }, function (response) {
        let rows = ''
        if (response.ats && response.ats.length) {
            for (const at of response.ats) {
                rows += '<tr><td>' + String(at.atRS).escapeHTML() + '</td><td>' + String(at.name).escapeHTML() + '</td><td>' + String(at.description).escapeHTML() + '</td><td>' + BRS.formatAmount(at.balanceNQT) + '</td></tr>'
            }
        }
        BRS.dataLoaded(rows)
    })
}
