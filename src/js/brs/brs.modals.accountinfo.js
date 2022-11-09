/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */

/* global $ */

import { BRS } from '.'

export function formsSetAccountInfoComplete (response, data) {
    const name = $.trim(String(data.name))
    if (name) {
        $('#account_name').html(name.escapeHTML()).removeAttr('data-i18n')
    } else {
        $('#account_name').html($.t('no_name_set')).attr('data-i18n', 'no_name_set')
    }

    const description = $.trim(String(data.description))

    setTimeout(function () {
        BRS.accountInfo.description = description
        BRS.accountInfo.name = name
    }, 1000)
}
