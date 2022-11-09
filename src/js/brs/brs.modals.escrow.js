/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */

/* global $ */

import { BRS } from '.'

export function showEscrowDecisionModal (escrow) {
    if (BRS.fetchingModalData) {
        return
    }

    BRS.fetchingModalData = true

    if (typeof escrow !== 'object') {
        BRS.sendRequest('getEscrowTransaction', {
            escrow
        }, function (response, input) {
            BRS.processEscrowDecisionModalData(response)
        })
    } else {
        BRS.processEscrowDecisionModalData(escrow)
    }
}

export function processEscrowDecisionModalData (escrow) {
    $('#escrow_decision_escrow').val(escrow.id)
    let decisions = ''
    for (let i = 0; i < escrow.signers.length; i++) {
        decisions += escrow.signers[i].idRS + ' ' + escrow.signers[i].decision + '<br />'
    }
    $('#escrow_decision_decisions').html(decisions)
    $('#escrow_decision_required').html(escrow.requiredSigners + ' signers required')
    $('#escrow_decision_deadline').html('Defaults to ' + escrow.deadlineAction + ' at ' + BRS.formatTimestamp(escrow.deadline))

    $('#escrow_decision_modal').modal('show')
    BRS.fetchingModalData = false
}
