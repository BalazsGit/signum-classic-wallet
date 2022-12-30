import { BRS } from '.'

import { logout } from './brs.login'

export function formsClearData (data) {
    const onDropped = function (error) {
        if (error != null) {
            alert('Something wrong happened')
        } else {
            console.log('Table deleted')
        }
    }

    if (!BRS.databaseSupport) {
        return { error: $.t('error_no_db_support') }
    }

    if (!data.contacts && !data.assets && !data.settings) {
        return { error: $.t('error_nothing_select') }
    }

    // For some reason just works with this setTimeout...
    setTimeout(function () {
        if (data.contacts) {
            BRS.database.drop('contacts', onDropped)
        }
    }, 10)

    setTimeout(function () {
        if (data.assets) {
            BRS.database.drop('assets', onDropped)
        }
    }, 60)

    setTimeout(function () {
        if (data.settings) {
            BRS.database.drop('data', onDropped)
            localStorage.removeItem('i18next_lng')
            localStorage.removeItem('logged_in')
            localStorage.removeItem('burst.node')
            localStorage.removeItem('burst.passphrase')
            localStorage.removeItem('theme')
        }
    }, 110)

    setTimeout(logout, 250)
    return { stop: true, hide: true }
}
