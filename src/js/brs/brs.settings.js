/**
 * @depends {brs.js}
 */

/* global $ */

import { BRS } from '.'

import { pageLoaded } from './brs'

import { submitForm } from './brs.forms'

import {
    convertToNXT,
    formatTimestamp
} from './brs.util'

export function pagesSettings () {
    for (const key in BRS.settings) {
        if (/_warning/i.test(key) && key != 'asset_transfer_warning') {
            if ($('#settings_' + key).length) {
                $('#settings_' + key).val(convertToNXT(BRS.settings[key]))
            }
        } else if (!/_color/i.test(key)) {
            if ($('#settings_' + key).length) {
                $('#settings_' + key).val(BRS.settings[key])
            }
        }
    }

    if (BRS.inApp) {
        $('#settings_console_log_div').hide()
    }

    pageLoaded()
}

export function getSettings () {
    if (BRS.databaseSupport) {
        BRS.database.select('data', [{
            id: 'settings'
        }], function (_error, result) {
            if (result && result.length) {
                BRS.settings = $.extend({}, BRS.defaultSettings, JSON.parse(result[0].contents))
            } else {
                BRS.database.insert('data', {
                    id: 'settings',
                    contents: '{}'
                })
                BRS.settings = BRS.defaultSettings
            }
            applySettings()
        })
    } else {
        BRS.settings = BRS.defaultSettings
        applySettings()
    }
}

function applySettings (key) {
    if (!key || key == 'language') {
        $.i18n.setLng(BRS.settings.language, null, function () {
            $('[data-i18n]').i18n()
        })
        if (BRS.inApp) {
            parent.postMessage({
                type: 'language',
                version: BRS.settings.language
            }, '*')
        }
    }

    if (!key || key == 'submit_on_enter') {
        if (BRS.settings.submit_on_enter) {
            $(".modal form:not('#decrypt_note_form_container')").on('submit.onEnter', function (e) {
                e.preventDefault()
                const $modal = $(this).closest('.modal')
                const $btn = $modal.find('button.btn-primary:not([data-dismiss=modal])')
                submitForm($btn)
            })
        } else {
            $('.modal form').off('submit.onEnter')
        }
    }

    if (!key || key == 'console_log') {
        if (BRS.inApp) {
            $('#show_console').hide()
        } else {
            if (BRS.downloadingBlockchain || BRS.settings.console_log === 0) {
                $('#show_console').hide()
            } else {
                $('#show_console').show()
            }
        }
    }

    if (!key || key == 'automatic_node_selection') {
        if (BRS.settings.automatic_node_selection) {
            $('#automatic_node_selection').prop('checked', true)
            $('#prefered_node').val(BRS.server)
            $('#prefered_node').prop('readonly', true)
        } else {
            $('#automatic_node_selection').prop('checked', false)
            $('#prefered_node').prop('readonly', false)
            $('#prefered_node').val(BRS.settings.prefered_node)
        }
    }

    if (!key || key == 'page_size') {
        BRS.pageSize = Number(BRS.settings.page_size)
    }

    if (key == '24_hour_format') {
        const $dashboard_dates = $('#dashboard_transactions_table a[data-timestamp], #dashboard_blocks_table td[data-timestamp]')
        $.each($dashboard_dates, function (key, value) {
            $(this).html(formatTimestamp($(this).data('timestamp')))
        })
    }

    if (!key || key == 'remember_passphrase') {
        if (BRS.settings.remember_passphrase) {
            $('#remember_password').prop('checked', true)
        } else {
            $('#remember_password').prop('checked', false)
        }
    }

    if (!key || key == 'remember_account') {
        if (BRS.settings.remember_account) {
            $('#remember_account').prop('checked', true)
            $('#login_account').val(BRS.settings.remember_account_account)
        } else {
            $('#remember_account').prop('checked', false)
            $('#login_account').val('')
        }
    }
}

export function updateSettings (key, value) {
    if (key) {
        BRS.settings[key] = value
    }

    if (BRS.databaseSupport) {
        BRS.database.update('data', {
            contents: JSON.stringify(BRS.settings)
        }, [{
            id: 'settings'
        }])
    }

    applySettings(key)
}
