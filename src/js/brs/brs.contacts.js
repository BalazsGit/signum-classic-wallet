/**
 * @depends {brs.js}
 */

import { BRS } from '.'
import { NxtAddress } from '../util/nxtaddress'

import {
    reloadCurrentPage,
    pageLoaded
} from './brs'

import {
    getAccountFormatted,
    dataLoaded
} from './brs.util'

export function getContactByName (nameToFind) {
    for (const accountId in BRS.contacts) {
        if (BRS.contacts[accountId].name === nameToFind) {
            return BRS.contacts[accountId]
        }
    }
}

export function pagesContacts () {
    if (!BRS.databaseSupport) {
        $('#contact_page_database_error').show()
        $('#contacts_table_container').hide()
        $('#add_contact_button').hide()
        pageLoaded()
        return
    }

    $('#contacts_table_container').show()
    $('#contact_page_database_error').hide()

    BRS.database.select('contacts', null, function (error, contacts) {
        let rows = ''
        if (error || !contacts) {
            dataLoaded(rows)
            return
        }
        contacts.sort(function (a, b) {
            if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1
            } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1
            } else {
                return 0
            }
        })

        for (const contact of contacts) {
            let contactDescription = contact.description

            if (contactDescription.length > 100) {
                contactDescription = contactDescription.substring(0, 100) + '...'
            } else if (!contactDescription) {
                contactDescription = '-'
            }

            const cName = String(contact.name).escapeHTML()
            rows += '<tr>'
            rows += `<td><a href='#' data-toggle='modal' data-target='#update_contact_modal' data-contact='${contact.id}'>${contact.name.escapeHTML()}</a></td>`
            rows += `<td><a href='#' data-user='${getAccountFormatted(contact, 'account')}' class='user_info'>${getAccountFormatted(contact, 'account')}</a></td>`
            rows += `<td>${contact.email ? contact.email.escapeHTML() : '-'}</td>`
            rows += `<td>${contactDescription.escapeHTML()}</td>`
            rows += `<td><div class="btn-group"><a class='btn btn-default' href='#' data-toggle='modal' data-target='#send_money_modal' data-contact='${cName}'><i class="fas fa-paper-plane"></i></a><a class='btn btn-default' href='#' data-toggle='modal' data-target='#send_message_modal' data-contact='${cName}'><i class="fas fa-envelope"></i></a><a class='btn btn-default' href='#' data-toggle='modal' data-target='#delete_contact_modal' data-contact='${contact.id}'><i class="fas fa-trash"></i></a></div></td>`
            rows += '</tr>'
        }

        dataLoaded(rows)
    })
}

function validateContactData (data) {
    if (!data.name) {
        return $.t('error_contact_name_required')
    }
    if (!data.account_id) {
        return $.t('error_account_id_required')
    }
    if (BRS.idRegEx.test(data.name) || BRS.rsRegEx.test(data.name)) {
        return $.t('error_contact_name_alpha')
    }
    if (data.email && !/@/.test(data.email)) {
        return $.t('error_email_address')
    }
    return ''
}

function notifyContactOperationSuccess (message) {
    $.notify(message, { type: 'success' })
    if (BRS.currentPage === 'contacts') {
        reloadCurrentPage()
        return
    }
    if (BRS.currentPage === 'messages' && BRS.selectedContext) {
        const heading = BRS.selectedContext.find('h4.list-group-item-heading')
        if (heading.length) {
            // TODO solve next line
            heading.html('data.name.escapeHTML()')
        }
    }
}

export function formsAddContact (data) {
    data.account_id = String(data.account_id)
    const error = validateContactData(data)
    if (error.length) {
        return { error }
    }
    if (data.account_id.charAt(0) === '@') {
        if (data.converted_account_id) {
            data.account_id = data.converted_account_id
        } else {
            return {
                error: $.t('error_account_id')
            }
        }
    }
    const address = new NxtAddress(data.account_id)
    if (address.isOk()) {
        data.account = address.getAccountId()
        data.account_rs = address.getAccountRS(BRS.prefix)
    } else {
        return {
            error: $.t('error_account_id')
        }
    }
    for (const Contact in BRS.contacts) {
        if (BRS.contacts[Contact].account === data.account_id) {
            return { error: $.t('error_contact_account_id_exists') }
        }
        if (BRS.contacts[Contact].name === data.name) {
            return { error: $.t('error_contact_name_exists') }
        }
    }

    addContactToDatabase(data)

    return { stop: true, hide: true }
}

function addContactToDatabase (data) {
    // Just insertion, no validation
    const record = {
        name: data.name,
        email: data.email,
        account: data.account,
        accountRS: data.account_rs,
        description: data.description
    }
    BRS.contacts[data.account_rs] = record
    if (!BRS.databaseSupport) {
        $.notify($.t('success_contact_add') + ' ' + $.t('contacts_no_db_warning'), { type: 'warning' })
        return
    }
    BRS.database.insert('contacts', record, function (error) {
        if (error) {
            $.notify($.t('error_save_db'))
            return
        }
        setTimeout(notifyContactOperationSuccess, 50, $.t('success_contact_add'))
    })
}

export function evUpdateContactModalOnShowBsModal (e) {
    const $invoker = $(e.relatedTarget)

    const contactId = parseInt($invoker.data('contact'), 10)

    if (!contactId && BRS.selectedContext) {
        const accountId = BRS.selectedContext.data('account')

        const dbKey = (BRS.rsRegEx.test(accountId) ? 'accountRS' : 'account')

        const dbQuery = {}
        dbQuery[dbKey] = accountId

        BRS.database.select('contacts', [dbQuery], function (error, contact) {
            if (error) {
                return
            }
            contact = contact[0]

            $('#update_contact_id').val(contact.id)
            $('#update_contact_name').val(contact.name)
            $('#update_contact_email').val(contact.email)
            $('#update_contact_account_id').val(contact.accountRS)
            $('#update_contact_description').val(contact.description)
        })
    } else {
        $('#update_contact_id').val(contactId)

        BRS.database.select('contacts', [{
            id: contactId
        }], function (error, contact) {
            if (error) {
                return
            }
            contact = contact[0]
            $('#update_contact_name').val(contact.name)
            $('#update_contact_email').val(contact.email)
            $('#update_contact_account_id').val(contact.accountRS)
            $('#update_contact_description').val(contact.description)
        })
    }
}

export function formsUpdateContact (data) {
    data.account_id = String(data.account_id)
    const error = validateContactData(data)
    if (error.length) {
        return { error }
    }
    if (data.account_id.charAt(0) === '@') {
        if (data.converted_account_id) {
            data.account_id = data.converted_account_id
        } else {
            return {
                error: $.t('error_account_id')
            }
        }
    }
    if (!data.contact_id) {
        return {
            error: $.t('error_contact')
        }
    }
    const address = new NxtAddress(data.account_id)
    if (address.isOk()) {
        data.account = address.getAccountId()
        data.account_rs = address.getAccountRS(BRS.prefix)
    } else {
        return {
            error: $.t('error_account_id')
        }
    }

    updateContactToDatabase(data)

    return { stop: true, hide: true }
}

function updateContactToDatabase (data) {
    BRS.contacts[data.account_rs] = {
        name: data.name,
        email: data.email,
        account: data.account,
        accountRS: data.account_rs,
        description: data.description
    }

    BRS.database.select('contacts', [{
        account: data.account
    }], function (error, contacts) {
        if (error ||
                (contacts && contacts.length && String(contacts[0].id) !== data.contact_id)) {
            $.notify($.t('error_save_db'))
            return
        }
        BRS.database.update('contacts', {
            name: data.name,
            email: data.email,
            account: data.account,
            accountRS: data.account_rs,
            description: data.description
        }, [{
            id: Number(data.contact_id)
        }], function (error) {
            if (error || (contacts.length && data.account !== contacts[0].account)) {
                $.notify($.t('error_save_db'))
                return
            }
            setTimeout(notifyContactOperationSuccess, 50, $.t('success_contact_update'))
        })
    })
}

export function evDeleteContactModalOnShowBsModal (e) {
    const $invoker = $(e.relatedTarget)

    const contactId = $invoker.data('contact')

    $('#delete_contact_id').val(contactId)

    BRS.database.select('contacts', [{
        id: contactId
    }], function (error, contact) {
        if (error) {
            return
        }
        contact = contact[0]

        $('#delete_contact_name').html(contact.name.escapeHTML())
        $('#delete_contact_account_rs').html(contact.accountRS)
        $('#delete_contact_account_id').html(contact.account)
        $('#delete_contact_account_rs').val(contact.accountRS)
    })
}

export function formsDeleteContact () {
    const id = parseInt($('#delete_contact_id').val(), 10)
    const accountRs = $('#delete_contact_account_rs').val()

    BRS.database.delete('contacts', [{
        id
    }], function () {
        delete BRS.contacts[accountRs]
        setTimeout(notifyContactOperationSuccess, 50, $.t('success_contact_delete'))
    })

    return { stop: true, hide: true }
}

export function exportContacts () {
    if (BRS.contacts && (Object.keys(BRS.contacts).length > 0)) {
        const contacts_download = document.createElement('a')
        contacts_download.href = 'data:attachment/json,' + encodeURIComponent(JSON.stringify(BRS.contacts))
        contacts_download.target = '_blank'
        contacts_download.download = 'contacts.json'
        document.body.appendChild(contacts_download)
        contacts_download.click()
        document.body.removeChild(contacts_download)
    } else {
        console.log('No contacts found in database to backup')
    }
}

export function importContacts (imported_contacts) {
    console.log('Import contacts called')
    console.log(imported_contacts)

    $.each(imported_contacts, function (index, imported_contact) {
        console.log('Importing contact ' + imported_contact.name)

        BRS.database.select('contacts', [{
            account: imported_contact.account
        }, {
            name: imported_contact.name
        }], function (_error, contacts) {
            if (contacts && contacts.length) {
                if (contacts[0].name === imported_contact.name) {
                    $.notify($.t('error_contact_name_exists'), { type: 'danger' })
                    console.log('Error, contact already exists with same name:' + imported_contact.name)
                } else {
                    $.notify($.t('error_contact_account_id_exists'), { type: 'danger' })
                    console.log('Error, contact already exists with same account ID:' + imported_contact.account)
                }
            } else {
                BRS.database.insert('contacts', {
                    name: imported_contact.name,
                    email: imported_contact.email,
                    account: imported_contact.account,
                    accountRS: imported_contact.accountRS,
                    description: imported_contact.description
                }, function (error) {
                    if (error) {
                        $.notify($.t('error_save_db'), { type: 'danger' })
                    }
                    BRS.contacts[imported_contact.account] = {
                        name: imported_contact.name,
                        email: imported_contact.email,
                        account: imported_contact.account,
                        accountRS: imported_contact.accountRS,
                        description: imported_contact.description
                    }

                    setTimeout(function () {
                        $.notify($.t('success_contact_add'), { type: 'success' })

                        if (BRS.currentPage === 'contacts') {
                            reloadCurrentPage()
                        } else if (BRS.currentPage === 'messages' && BRS.selectedContext) {
                            const heading = BRS.selectedContext.find('h4.list-group-item-heading')
                            if (heading.length) {
                                heading.html(imported_contact.name.escapeHTML())
                            }
                            BRS.selectedContext.data('context', 'messages_sidebar_update_context')
                        }
                    }, 50)
                })
            }
        })
    })
}
