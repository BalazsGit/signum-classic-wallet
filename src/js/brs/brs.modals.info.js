/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */

/* global $ */

import { BRS } from '.'

export function evBrsModalOnShowBsModal (e) {
    if (BRS.fetchingModalData) {
        return
    }

    BRS.fetchingModalData = true

    BRS.sendRequest('getState', function (state) {
        for (const key in state) {
            const el = $('#brs_node_state_' + key)
            if (el.length) {
                if (key.indexOf('number') !== -1) {
                    el.html(BRS.formatAmount(state[key]))
                } else if (key.indexOf('Memory') !== -1) {
                    el.html(BRS.formatVolume(state[key]))
                } else if (key === 'time') {
                    el.html(BRS.formatTimestamp(state[key]))
                } else {
                    el.html(String(state[key]).escapeHTML())
                }
            }
        }

        $('#brs_update_explanation').show()
        $('#brs_modal_state').show()

        BRS.fetchingModalData = false
    })
}
