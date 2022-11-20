/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */

/* global $ */

import { BRS } from '.'

import { sendRequest } from './brs.server'

import {
    formatVolume,
    formatAmount,
    formatTimestamp
} from './brs.util'

export function evBrsModalOnShowBsModal (e) {
    if (BRS.fetchingModalData) {
        return
    }

    BRS.fetchingModalData = true

    sendRequest('getState', function (state) {
        for (const key in state) {
            const el = $('#brs_node_state_' + key)
            if (el.length) {
                if (key.indexOf('number') !== -1) {
                    el.html(formatAmount(state[key]))
                } else if (key.indexOf('Memory') !== -1) {
                    el.html(formatVolume(state[key]))
                } else if (key === 'time') {
                    el.html(formatTimestamp(state[key]))
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
