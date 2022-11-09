/**
 * @depends {brs.js}
 * @depends {brs.modals.js}
 */

/* global $ */

import { BRS } from '.'

export function showAccountModal (account) {
    if (BRS.fetchingModalData) {
        return
    }

    if (typeof account === 'object') {
        BRS.userInfoModal.user = account.account
    } else {
        BRS.userInfoModal.user = account
        BRS.fetchingModalData = true
    }

    $('#user_info_modal_account').html(BRS.getAccountFormatted(BRS.userInfoModal.user))

    let accountButton
    if (BRS.userInfoModal.user in BRS.contacts) {
        accountButton = BRS.contacts[BRS.userInfoModal.user].name.escapeHTML()
        $('#user_info_modal_add_as_contact').hide()
    } else {
        accountButton = BRS.userInfoModal.user
        $('#user_info_modal_add_as_contact').show()
    }

    $('#user_info_modal_actions button').data('account', accountButton)

    if (BRS.fetchingModalData) {
        BRS.sendRequest('getAccount', {
            account: BRS.userInfoModal.user
        }, function (response) {
            processAccountModalData(response)
            BRS.fetchingModalData = false
        })
    } else {
        processAccountModalData(account)
    }

    $('#user_info_modal_transactions').show()

    userInfoModalTransactions()
}

function processAccountModalData (account) {
    if (account.unconfirmedBalanceNQT === '0') {
        $('#user_info_modal_account_balance').html('0')
    } else {
        $('#user_info_modal_account_balance').html(BRS.formatAmount(account.unconfirmedBalanceNQT) + ' ' + BRS.valueSuffix)
    }

    if (account.name) {
        $('#user_info_modal_account_name').html(String(account.name).escapeHTML())
        $('#user_info_modal_account_name_container').show()
    } else {
        $('#user_info_modal_account_name_container').hide()
    }

    if (account.description) {
        $('#user_info_description').show()
        $('#user_info_modal_description').html(String(account.description).escapeHTML().nl2br())
    } else {
        $('#user_info_description').hide()
    }

    $('#user_info_modal').modal('show')
}

export function loadUserInfoModal (tabName, param) {
    switch (tabName) {
    case 'transactions':
        return userInfoModalTransactions(param)
    case 'aliases':
        return userInfoModalAliases()
    case 'smartcontract':
        return userInfoModalSmartcontract()
    case 'assets':
        return userInfoModalAssets()
    case 'addIssuedAssets':
        return userInfoModalAddIssuedAssets(param)
    case 'assetsLoaded':
        return userInfoModalAssetsLoaded(param)
    }
}

function userInfoModalTransactions (type) {
    BRS.sendRequest('getAccountTransactions', {
        account: BRS.userInfoModal.user,
        firstIndex: 0,
        lastIndex: BRS.pageSize,
        includeIndirect: true
    }, function (response) {
        let rows = ''
        if (response.transactions && response.transactions.length) {
            for (const transaction of response.transactions) {
                const details = BRS.getTransactionDetails(transaction, BRS.userInfoModal.user)

                rows += '<tr>'
                rows += "<td><a href='#' data-transaction='" + String(transaction.transaction).escapeHTML() + "' data-timestamp='" + String(transaction.timestamp).escapeHTML() + "'>" + BRS.formatTimestamp(transaction.timestamp) + '</a></td>'
                rows += '<td>' + details.nameOfTransaction + '</td>'
                rows += '<td>' + details.circleText + '</td>'
                rows += `<td ${details.colorClass}>${details.amountToFromViewerHTML}</td>`
                rows += '<td>' + BRS.formatAmount(transaction.feeNQT) + '</td>'
                rows += `<td>${details.accountTitle}</td>`
                rows += '</tr>'
            }
        }
        $('#user_info_modal_transactions_table tbody').empty().append(rows)
        BRS.dataLoadFinished($('#user_info_modal_transactions_table'))
    })
}

function userInfoModalAliases () {
    BRS.sendRequest('getAliases', {
        account: BRS.userInfoModal.user,
        timestamp: 0
    }, function (response) {
        let rows = ''

        if (response.aliases && response.aliases.length) {
            const aliases = response.aliases

            aliases.sort(function (a, b) {
                if (a.aliasName.toLowerCase() > b.aliasName.toLowerCase()) {
                    return 1
                } else if (a.aliasName.toLowerCase() < b.aliasName.toLowerCase()) {
                    return -1
                } else {
                    return 0
                }
            })

            let alias_account_count = 0
            let alias_uri_count = 0
            let empty_alias_count = 0
            const alias_count = aliases.length

            for (let i = 0; i < alias_count; i++) {
                const alias = aliases[i]

                rows += "<tr data-alias='" + String(alias.aliasName).toLowerCase().escapeHTML() + "'><td class='alias'>" + String(alias.aliasName).escapeHTML() + "</td><td class='uri'>" + (alias.aliasURI.indexOf('http') === 0 ? "<a href='" + String(alias.aliasURI).escapeHTML() + "' target='_blank'>" + String(alias.aliasURI).escapeHTML() + '</a>' : String(alias.aliasURI).escapeHTML()) + '</td></tr>'
                if (!alias.uri) {
                    empty_alias_count++
                } else if (alias.aliasURI.indexOf('http') === 0) {
                    alias_uri_count++
                } else if (alias.aliasURI.indexOf('acct:') === 0 || alias.aliasURI.indexOf('nacc:') === 0) {
                    alias_account_count++
                }
            }
        }

        $('#user_info_modal_aliases_table tbody').empty().append(rows)
        BRS.dataLoadFinished($('#user_info_modal_aliases_table'))
    })
}

function userInfoModalSmartcontract () {
    BRS.sendRequest('getAT', {
        at: BRS.convertRSAccountToNumeric(BRS.userInfoModal.user)
    }, function (response) {
        let rows = ''
        if (response.errorCode) {
            $('#user_info_modal_smartcontract_table tbody').empty()
            BRS.dataLoadFinished($('#user_info_modal_smartcontract_table'))
            return
        }
        const props = [
            'name',
            'description',
            'creatorRS',
            'minActivation',
            'machineCodeHashId',
            'status',
            'atVersion',
            'creationBlock',
            'machineData',
            'machineCode'
        ]
        for (const row of props) {
            const key = row.replace(/\s+/g, '').replace(/([A-Z])/g, function ($1) {
                return '_' + $1.toLowerCase()
            })
            rows += '<tr>'
            rows += `<td>${$.t(key)}</td>`
            let codeHTML = ''
            switch (row) {
            case 'minActivation':
                codeHTML = BRS.formatAmount(response[row]) + ' ' + BRS.valueSuffix
                break
            case 'creatorRS':
                codeHTML = BRS.getAccountTitle(response[row])
                break
            case 'machineCode':
                codeHTML = response[row].replace(/0+$/, '')
                break
            case 'status':
                for (const val of ['running', 'stopped', 'finished', 'frozen', 'dead']) {
                    if (response[val] === true) {
                        codeHTML += (codeHTML === '' ? '' : ' + ') + $.t(val)
                    }
                }
                break
            default:
                codeHTML = String(response[row]).escapeHTML()
            }
            rows += `<td style='word-break: break-word;'>${codeHTML}</td>`
            rows += '</tr>'
        }
        $('#user_info_modal_smartcontract_table tbody').html(rows)
        BRS.dataLoadFinished($('#user_info_modal_smartcontract_table'))
    })
}

function userInfoModalAssets () {
    BRS.sendRequest('getAccount', {
        account: BRS.userInfoModal.user
    }, function (response) {
        if (response.assetBalances && response.assetBalances.length) {
            const assets = {}
            let nrAssets = 0
            let ignoredAssets = 0

            for (let i = 0; i < response.assetBalances.length; i++) {
                if (response.assetBalances[i].balanceQNT === '0') {
                    ignoredAssets++

                    if (nrAssets + ignoredAssets === response.assetBalances.length) {
                        userInfoModalAddIssuedAssets(assets)
                    }
                    continue
                }

                BRS.sendRequest('getAsset', {
                    asset: response.assetBalances[i].asset,
                    _extra: {
                        balanceQNT: response.assetBalances[i].balanceQNT
                    }
                }, function (asset, input) {
                    asset.asset = input.asset
                    asset.balanceQNT = input._extra.balanceQNT

                    assets[asset.asset] = asset
                    nrAssets++

                    if (nrAssets + ignoredAssets === response.assetBalances.length) {
                        userInfoModalAddIssuedAssets(assets)
                    }
                })
            }
        } else {
            userInfoModalAddIssuedAssets({})
        }
    })
}

function userInfoModalAddIssuedAssets (assets) {
    BRS.sendRequest('getAssetsByIssuer', {
        account: BRS.userInfoModal.user
    }, function (response) {
        if (response.assets && response.assets.length) {
            $.each(response.assets, function (key, issuedAsset) {
                if (assets[issuedAsset.asset]) {
                    assets[issuedAsset.asset].issued = true
                } else {
                    issuedAsset.balanceQNT = '0'
                    issuedAsset.issued = true
                    assets[issuedAsset.asset] = issuedAsset
                }
            })

            BRS.userInfoModalAssetsLoaded(assets)
        } else if (!$.isEmptyObject(assets)) {
            BRS.userInfoModalAssetsLoaded(assets)
        } else {
            $('#user_info_modal_assets_table tbody').empty()
            BRS.dataLoadFinished($('#user_info_modal_assets_table'))
        }
    })
}

function userInfoModalAssetsLoaded (assets) {
    const assetArray = []
    let rows = ''

    $.each(assets, function (key, asset) {
        assetArray.push(asset)
    })

    assetArray.sort(function (a, b) {
        if (a.issued && b.issued) {
            if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1
            } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1
            } else {
                return 0
            }
        } else if (a.issued) {
            return -1
        } else if (b.issued) {
            return 1
        } else {
            if (a.name.toLowerCase() > b.name.toLowerCase()) {
                return 1
            } else if (a.name.toLowerCase() < b.name.toLowerCase()) {
                return -1
            } else {
                return 0
            }
        }
    })

    for (let i = 0; i < assetArray.length; i++) {
        const asset = assetArray[i]

        const percentageAsset = BRS.calculatePercentage(asset.balanceQNT, asset.quantityCirculatingQNT)

        rows += '<tr' + (asset.issued ? " class='asset_owner'" : '') + "><td><a href='#' data-goto-asset='" + String(asset.asset).escapeHTML() + "'" + (asset.issued ? " style='font-weight:bold'" : '') + '>' + String(asset.name).escapeHTML() + "</a></td><td class='quantity'>" + BRS.formatQuantity(asset.balanceQNT, asset.decimals) + '</td><td>' + BRS.formatQuantity(asset.quantityCirculatingQNT, asset.decimals) + '</td><td>' + percentageAsset + '%</td></tr>'
    }

    $('#user_info_modal_assets_table tbody').empty().append(rows)

    BRS.dataLoadFinished($('#user_info_modal_assets_table'))
}
