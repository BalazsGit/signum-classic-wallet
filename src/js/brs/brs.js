/**
 * @depends {3rdparty/jquery.min.js}
 * @depends {3rdparty/bootstrap.min.js}
 * @depends {3rdparty/big.js}
 * @depends {3rdparty/jsbn.js}
 * @depends {3rdparty/jsbn2.js}
 * @depends {3rdparty/pako.min.js}
 * @depends {3rdparty/webdb.js}
 * @depends {3rdparty/ajaxmultiqueue.js}
 * @depends {3rdparty/notify.min.js}
 * @depends {3rdparty/clipboard.js}
 * @depends {crypto/passphrasegenerator.js}
 * @depends {crypto/sha256worker.js}
 * @depends {crypto/3rdparty/aes.js}
 * @depends {crypto/3rdparty/sha256.js}
 * @depends {crypto/3rdparty/jssha256.js}
 * @depends {crypto/3rdparty/seedrandom.js}
 * @depends {util/converters.js}
 * @depends {util/extensions.js}
 * @depends {util/nxtaddress.js}
 */

/* global $ WebDB BigInteger */

import { BRS } from '.'

export function init () {
    try {
        if (window.localStorage) {
            BRS.hasLocalStorage = true
        }
    } catch (err) {
        BRS.hasLocalStorage = false
    }
    // Default location for notify message (set once)
    $.notifyDefaults({
        placement: { from: 'bottom', align: 'right' },
        offset: 10
    })
    BRS.theme()

    BRS.createDatabase(function () {
        BRS.getSettings()
    })

    // Give some more time to loading settings
    setTimeout(function () {
        if (BRS.settings.automatic_node_selection) {
            BRS.autoSelectServer()
        } else {
            // use user saved choice
            BRS.getState()
        }
        BRS.showLockscreen()
    }, 250)

    if (window.parent) {
        const match = window.location.href.match(/\?app=?(win|mac|lin)?-?([\d.]+)?/i)

        if (match) {
            BRS.inApp = true
            if (match[1]) {
                BRS.appPlatform = match[1]
            }
            if (match[2]) {
                BRS.appVersion = match[2]
            }

            if (!BRS.appPlatform || BRS.appPlatform === 'mac') {
                let macVersion = navigator.userAgent.match(/OS X 10_([0-9]+)/i)
                if (macVersion && macVersion[1]) {
                    macVersion = parseInt(macVersion[1])

                    if (macVersion < 9) {
                        $('.modal').removeClass('fade')
                    }
                }
            }

            $('#show_console').hide()

            // TODO: remove inApp
            // parent.postMessage('loaded', '*')
            // window.addEventListener('message', receiveMessage, false)
        }
    }

    BRS.setStateInterval(30)

    BRS.allowLoginViaEnter()
    BRS.automaticallyCheckRecipient()

    $('.show_popover').popover({
        trigger: 'hover'
    })

    $('#dashboard_transactions_table, #transactions_table').on('mouseenter', 'td.confirmations', function () {
        $(this).popover('show')
    }).on('mouseleave', 'td.confirmations', function () {
        $(this).popover('destroy')
        $('.popover').remove()
    })

    _fix()

    $(window).on('resize', function () {
        _fix()

        if (BRS.currentPage === 'asset_exchange') {
            BRS.positionAssetSidebar()
        }
    })

    $("[data-toggle='tooltip']").tooltip()

    $('.sidebar .treeview').tree()

    setInterval(setHeaderClock, 1000)

    /*
          $("#asset_exchange_search input[name=q]").addClear({
          right: 0,
          top: 4,
          onClear: function(input) {
          $("#asset_exchange_search").trigger("submit");
          }
          });

          $("#id_search input[name=q], #alias_search input[name=q]").addClear({
          right: 0,
          top: 4
          }); */
}

function _fix () {
    const height = $(window).height() - $('body > .header').height()
    // $(".wrapper").css("min-height", height + "px");
    const content = $('.wrapper').height()

    $('.content.content-stretch:visible').width($('.page:visible').width())

    if (content > height) {
        $('.left-side, html, body').css('min-height', content + 'px')
    } else {
        $('.left-side, html, body').css('min-height', height + 'px')
    }
}

export function setStateInterval (seconds) {
    if (seconds === BRS.stateIntervalSeconds && BRS.stateInterval) {
        return
    }

    if (BRS.stateInterval) {
        clearInterval(BRS.stateInterval)
    }

    BRS.stateIntervalSeconds = seconds

    BRS.stateInterval = setInterval(function () {
        BRS.getState()
    }, 1000 * seconds)
}

export function checkSelectedNode () {
    const preferedNode = $('#prefered_node').val()
    if (preferedNode !== BRS.server) {
        // Server changed, get new network details
        BRS.server = preferedNode
        BRS.sendRequest('getConstants', function (response) {
            if (response.errorCode) {
                return
            }
            if (response.networkName.includes('TESTNET')) {
                BRS.isTestNet = true
                $('.testnet_only, #testnet_login, #testnet_warning').show()
                $('.testnet_only').show()
            } else {
                BRS.isTestNet = false
                $('.testnet_only, #testnet_login, #testnet_warning').hide()
                $('.testnet_only').hide()
            }
            BRS.prefix = response.addressPrefix + '-'
            BRS.valueSuffix = response.valueSuffix
        })
    }
}

export function autoSelectServer () {
    if (!BRS.multiQueue) {
        BRS.multiQueue = $.ajaxMultiQueue(8)
    }
    const ajaxCall = BRS.multiQueue.queue
    // shuffleArray but keep localhost as first one
    const mainnetServers = BRS.nodes.filter(obj => obj.testnet === false).slice(1)
    for (let i = mainnetServers.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [mainnetServers[i], mainnetServers[j]] = [mainnetServers[j], mainnetServers[i]]
    }
    mainnetServers.unshift(BRS.nodes[0])
    const responses = []
    setTimeout(() => {
        // choose winner
        responses.sort((a, b) => b[2] - a[2])
        $('#prefered_node').val(responses[0][0])
        BRS.getState()
    }, 2100)
    for (const server of mainnetServers) {
        ajaxCall({
            url: `${server.address}/burst?requestType=getBlock`,
            crossDomain: true,
            dataType: 'json',
            type: 'GET',
            timeout: 2000,
            async: true
        }).done(function (response, status, xhr) {
            if (status === 'success' && response.errorCode === undefined) {
                const fasterResponse = responses.find(row => row[1] === response.block)
                if (fasterResponse) {
                    fasterResponse[2] = fasterResponse[2] + 1
                    return
                }
                responses.push([server.address, response.block, 1])
            }
        })
    }
}

function setHeaderClock () {
    const lastBlockDate = new Date(Date.UTC(2014, 7, 11, 2, 0, 0, 0) + BRS.state.lastBlockTimestamp * 1000)
    const diffSeconds = Math.floor((Date.now() - lastBlockDate.getTime()) / 1000)
    const minutes = (diffSeconds / 60) < 10 ? '0' + Math.floor(diffSeconds / 60).toString() : Math.floor(diffSeconds / 60).toString()
    const seconds = (diffSeconds % 60) < 10 ? '0' + (diffSeconds % 60).toString() : (diffSeconds % 60).toString()
    $('#header_block_time').html(minutes + ':' + seconds)
}

export function getState (callback) {
    checkSelectedNode()

    BRS.sendRequest('getBlockchainStatus', function (response) {
        if (response.errorCode) {
            if (response.errorCode == -1) {
                if (BRS.settings.automatic_node_selection) {
                    BRS.autoSelectServer()
                    return
                }
                $('#node_alert').show()
                $('#brs_version, #brs_version_dashboard').html(BRS.loadingDotsHTML).addClass('loading_dots')
            }
            return
        }
        $('#node_alert').hide()
        const firstTime = !('lastBlock' in BRS.state)
        const previousLastBlock = (firstTime ? '0' : BRS.state.lastBlock)

        BRS.state = response

        $('#brs_version').html(BRS.state.version + ' on ' + BRS.server).removeClass('loading_dots')
        $('#brs_version_dashboard').html(BRS.state.version).removeClass('loading_dots')
        $('#header_current_block').html('#' + BRS.state.numberOfBlocks)
        setHeaderClock()
        switch (true) {
        case firstTime:
            BRS.getBlock(BRS.state.lastBlock, BRS.handleInitialBlocks)
            break
        case BRS.state.isScanning:
            // do nothing but reset BRS.state so that when isScanning is done, everything is reset.
            BRS.isScanning = true
            break
        case BRS.isScanning:
            // rescan is done, now we must reset everything...
            BRS.isScanning = false
            BRS.blocks = []
            BRS.tempBlocks = []
            BRS.getBlock(BRS.state.lastBlock, BRS.handleInitialBlocks)
            if (BRS.account) {
                BRS.getInitialTransactions()
                BRS.getAccountInfo()
            }
            break
        case (previousLastBlock !== BRS.state.lastBlock):
            BRS.tempBlocks = []
            if (BRS.account) {
                BRS.getAccountInfo(false, BRS.cacheUserAssets)
            }
            BRS.getBlock(BRS.state.lastBlock, BRS.handleNewBlocks)
            if (BRS.account) {
                BRS.getNewTransactions()
            }
            break
        default:
            if (BRS.account) {
                BRS.getUnconfirmedTransactions(function (unconfirmedTransactions) {
                    BRS.handleIncomingTransactions(unconfirmedTransactions, false)
                })
            }
            // only done so that download progress meter updates correctly based on lastFeederHeight
            if (BRS.downloadingBlockchain) {
                BRS.updateBlockchainDownloadProgress()
            }
        }

        if (callback) {
            callback()
        }
    })

    BRS.saveCachedAssets()
}

export function logoSidebarClick (e, data) {
    if ($(this).hasClass('ignore')) {
        $(this).removeClass('ignore')
        return
    }

    e.preventDefault()

    if ($(this).data('toggle') === 'modal') {
        return
    }

    const page = $(this).data('page')

    if (page === 'keep' || page === BRS.currentPage) {
        if (data && data.callback) {
            data.callback()
        }
        return
    }

    $('.page').hide()

    $('#' + page + '_page').show()

    $('.content-header h1').find('.loading_dots').remove()

    const changeActive = !($(this).closest('ul').hasClass('treeview-menu'))

    if (changeActive) {
        const currentActive = $('ul.sidebar-menu > li.active')

        if (currentActive.hasClass('treeview')) {
            currentActive.children('a').first().addClass('ignore').click()
        } else {
            currentActive.removeClass('active')
        }

        if ($(this).attr('id') && $(this).attr('id') == 'logo') {
            $('#dashboard_link').addClass('active')
        } else {
            $(this).parent().addClass('active')
        }
    }

    if (BRS.currentPage !== 'messages') {
        $('#inline_message_password').val('')
    }

    BRS.currentPage = page
    BRS.currentSubPage = ''
    BRS.pageNumber = 1
    BRS.showPageNumbers = false

    if (BRS.pages[page]) {
        BRS.pageLoading()

        if (data && data.callback) {
            BRS.pages[page](data.callback)
        } else if (data) {
            BRS.pages[page](data)
        } else {
            BRS.pages[page]()
        }
    }
}

export function loadPage (page, callback) {
    BRS.pageLoading()
    BRS.pages[page](callback)
}

export function goToPage (page, callback) {
    let $link = $('ul.sidebar-menu a[data-page=' + page + ']')

    if ($link.length > 1) {
        if ($link.last().is(':visible')) {
            $link = $link.last()
        } else {
            $link = $link.first()
        }
    }

    if ($link.length === 1) {
        if (callback) {
            $link.trigger('click', [{
                callback
            }])
        } else {
            $link.trigger('click')
        }
    } else {
        BRS.currentPage = page
        BRS.currentSubPage = ''
        BRS.pageNumber = 1
        BRS.showPageNumbers = false

        $('ul.sidebar-menu a.active').removeClass('active')
        $('.page').hide()
        $('#' + page + '_page').show()
        if (BRS.pages[page]) {
            BRS.pageLoading()
            BRS.pages[page](callback)
        }
    }
}

export function pageLoading () {
    BRS.hasMorePages = false

    const $pageHeader = $('#' + BRS.currentPage + '_page .content-header h1')
    $pageHeader.find('.loading_dots').remove()
    $pageHeader.append("<span class='loading_dots'>" + BRS.loadingDotsHTML + '</span>')
}

export function pageLoaded (callback) {
    const $currentPage = $('#' + BRS.currentPage + '_page')

    $currentPage.find('.content-header h1 .loading_dots').remove()

    if ($currentPage.hasClass('paginated')) {
        BRS.addPagination()
    }

    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })

    if (callback) {
        callback()
    }
}

export function addPagination (section) {
    let output = ''

    if (BRS.pageNumber === 2) {
        output += "<a href='#' data-page='1'>&laquo; " + $.t('previous_page') + '</a>'
    } else if (BRS.pageNumber > 2) {
        // output += "<a href='#' data-page='1'>&laquo; First Page</a>";
        output += " <a href='#' data-page='" + (BRS.pageNumber - 1) + "'>&laquo; " + $.t('previous_page') + '</a>'
    }
    if (BRS.hasMorePages) {
        if (BRS.pageNumber > 1) {
            output += '&nbsp;&nbsp;&nbsp;'
        }
        output += " <a href='#' data-page='" + (BRS.pageNumber + 1) + "'>" + $.t('next_page') + ' &raquo;</a>'
    }

    const $paginationContainer = $('#' + BRS.currentPage + '_page .data-pagination')

    if ($paginationContainer.length) {
        $paginationContainer.html(output)
    }
}

export function goToPageNumber (pageNumber) {
    /* if (!pageLoaded) {
          return;
          } */
    BRS.pageNumber = pageNumber

    BRS.pageLoading()

    BRS.pages[BRS.currentPage]()
}

export function createDatabase (callback) {
    const schema = {
        contacts: {
            id: {
                primary: true,
                autoincrement: true,
                type: 'NUMBER'
            },
            name: 'VARCHAR(100) COLLATE NOCASE',
            email: 'VARCHAR(200)',
            account: 'VARCHAR(25)',
            accountRS: 'VARCHAR(25)',
            description: 'TEXT'
        },
        assets: {
            account: 'VARCHAR(25)',
            accountRS: 'VARCHAR(25)',
            asset: {
                primary: true,
                type: 'VARCHAR(25)'
            },
            description: 'TEXT',
            name: 'VARCHAR(10)',
            decimals: 'NUMBER',
            quantityQNT: 'VARCHAR(15)',
            groupName: 'VARCHAR(30) COLLATE NOCASE'
        },
        data: {
            id: {
                primary: true,
                type: 'VARCHAR(40)'
            },
            contents: 'TEXT'
        }
    }

    BRS.assetTableKeys = ['account', 'accountRS', 'asset', 'description', 'name', 'position', 'decimals', 'quantityQNT', 'groupName']

    try {
        BRS.database = new WebDB('BRS_USER_DB', schema, 2, 4, function (error, db) {
            if (!error) {
                BRS.databaseSupport = true

                // loadContacts
                BRS.database.select('contacts', null, function (error, contacts) {
                    if (error) return
                    for (const contact of contacts) {
                        BRS.contacts[contact.accountRS] = contact
                    }
                })

                BRS.database.select('data', [{
                    id: 'asset_exchange_version'
                }], function (_error, result) {
                    if (!result || !result.length) {
                        BRS.database.delete('assets', [], function (error, affected) {
                            if (!error) {
                                BRS.database.insert('data', {
                                    id: 'asset_exchange_version',
                                    contents: 2
                                })
                            }
                        })
                    }
                })

                BRS.database.select('data', [{
                    id: 'closed_groups'
                }], function (_error, result) {
                    if (result && result.length) {
                        BRS.closedGroups = result[0].contents.split('#')
                    } else {
                        BRS.database.insert('data', {
                            id: 'closed_groups',
                            contents: ''
                        })
                    }
                })
                if (callback) {
                    callback()
                }
            } else if (callback) {
                callback()
            }
        })
    } catch (err) {
        BRS.database = null
        BRS.databaseSupport = false
        if (callback) {
            callback()
        }
    }
}

export function clearData () {
    const onDropped = function (error) {
        if (error != null) {
            alert('Something wrong happened')
        } else {
            console.log('Table deleted')
        }
    }

    let anwser
    if (BRS.databaseSupport) {
        if (window.confirm($.t('remove_contacts_bookmark_q'))) {
            BRS.database.drop('contacts', onDropped)
        }
        if (window.confirm($.t('remove_assets_bookmark_q'))) {
            BRS.database.drop('assets', onDropped)
        }
        if (window.confirm($.t('remove_settings_q'))) {
            BRS.database.drop('data', onDropped)
            localStorage.removeItem('i18next_lng')
            localStorage.removeItem('logged_in')
            localStorage.removeItem('theme')
        }
    }

    setTimeout(BRS.logout, 250)
}

export function getAccountInfo (firstRun, callback) {
    BRS.sendRequest('getAccount', {
        account: BRS.account,
        getCommittedAmount: 'true'
    }, function (response) {
        const previousAccountInfo = BRS.accountInfo

        BRS.accountInfo = response

        if (response.errorCode) {
            $('#account_balance, #account_committed_balance, #account_balance_sendmoney').html('0')
            $('#account_nr_assets').html('0')

            if (BRS.accountInfo.errorCode === 5) {
                if (BRS.downloadingBlockchain) {
                    if (BRS.newlyCreatedAccount) {
                        $('#dashboard_message').addClass('alert-success').removeClass('alert-danger').html($.t('status_new_account', {
                            account_id: String(BRS.accountRS).escapeHTML(),
                            public_key: String(BRS.publicKey).escapeHTML()
                        }) + '<br /><br />' + $.t('status_blockchain_downloading')).show()
                    } else {
                        $('#dashboard_message').addClass('alert-success').removeClass('alert-danger').html($.t('status_blockchain_downloading')).show()
                    }
                } else if (BRS.state && BRS.state.isScanning) {
                    $('#dashboard_message').addClass('alert-danger').removeClass('alert-success').html($.t('status_blockchain_rescanning')).show()
                } else {
                    $('#dashboard_message').addClass('alert-success').removeClass('alert-danger').html($.t('status_new_account', {
                        account_id: String(BRS.accountRS).escapeHTML(),
                        public_key: String(BRS.publicKey).escapeHTML()
                    })).show()
                }
            } else {
                $('#dashboard_message').addClass('alert-danger').removeClass('alert-success').html(BRS.accountInfo.errorDescription ? BRS.accountInfo.errorDescription.escapeHTML() : $.t('error_unknown')).show()
            }
        } else {
            if (BRS.accountRS && BRS.accountInfo.accountRS !== BRS.accountRS) {
                $.notify('Generated Reed Solomon address different from the one in the blockchain!', { type: 'danger' })
                BRS.accountRS = BRS.accountInfo.accountRS
            }

            if (BRS.downloadingBlockchain) {
                $('#dashboard_message').addClass('alert-success').removeClass('alert-danger').html($.t('status_blockchain_downloading')).show()
            } else if (BRS.state && BRS.state.isScanning) {
                $('#dashboard_message').addClass('alert-danger').removeClass('alert-success').html($.t('status_blockchain_rescanning')).show()
            } else if (!BRS.accountInfo.publicKey) {
                $('#dashboard_message').addClass('alert-danger').removeClass('alert-success').html($.t('no_public_key_warning') + ' ' + $.t('public_key_actions')).show()
            } else {
                $('#dashboard_message').hide()
            }

            // only show if happened within last week
            const showAssetDifference = (!BRS.downloadingBlockchain || (BRS.blocks && BRS.blocks[0] && BRS.state && BRS.state.time - BRS.blocks[0].timestamp < 60 * 60 * 24 * 7))

            if (BRS.databaseSupport) {
                BRS.database.select('data', [{
                    id: 'asset_balances_' + BRS.account
                }], function (_error, asset_balance) {
                    if (asset_balance && asset_balance.length) {
                        let previous_balances = asset_balance[0].contents

                        if (!BRS.accountInfo.assetBalances) {
                            BRS.accountInfo.assetBalances = []
                        }

                        const current_balances = JSON.stringify(BRS.accountInfo.assetBalances)

                        if (previous_balances !== current_balances) {
                            if (previous_balances !== 'undefined' && typeof previous_balances !== 'undefined') {
                                previous_balances = JSON.parse(previous_balances)
                            } else {
                                previous_balances = []
                            }
                            BRS.database.update('data', {
                                contents: current_balances
                            }, [{
                                id: 'asset_balances_' + BRS.account
                            }])
                            if (showAssetDifference) {
                                checkAssetDifferences(BRS.accountInfo.assetBalances, previous_balances)
                            }
                        }
                    } else {
                        BRS.database.insert('data', {
                            id: 'asset_balances_' + BRS.account,
                            contents: JSON.stringify(BRS.accountInfo.assetBalances)
                        })
                    }
                })
            } else if (showAssetDifference && previousAccountInfo && previousAccountInfo.assetBalances) {
                const previousBalances = JSON.stringify(previousAccountInfo.assetBalances)
                const currentBalances = JSON.stringify(BRS.accountInfo.assetBalances)

                if (previousBalances !== currentBalances) {
                    checkAssetDifferences(BRS.accountInfo.assetBalances, previousAccountInfo.assetBalances)
                }
            }

            $('#account_balance, #account_balance_sendmoney').html(BRS.formatStyledAmount(response.unconfirmedBalanceNQT))
            $('#account_balance_locked, #account_balance_sendmoney').html(BRS.formatStyledAmount((new BigInteger(response.balanceNQT) - new BigInteger(response.unconfirmedBalanceNQT)).toString()))
            $('#account_committed_balance, #account_balance_sendmoney').html(BRS.formatStyledAmount(response.committedBalanceNQT))
            $('#account_forged_balance').html(BRS.formatStyledAmount(response.committedBalanceNQT))

            let nr_assets = 0

            if (response.assetBalances) {
                for (let i = 0; i < response.assetBalances.length; i++) {
                    if (response.assetBalances[i].balanceQNT != '0') {
                        nr_assets++
                    }
                }
            }

            $('#account_nr_assets').html(nr_assets)

            if (response.name) {
                $('#account_name').html(response.name.escapeHTML()).removeAttr('data-i18n')
            }
        }

        if (firstRun) {
            $('#account_balance, #account_committed_balance, #account_nr_assets, #account_balance_sendmoney').removeClass('loading_dots')
        }

        if (callback) {
            callback()
        }
    })
}

function checkAssetDifferences (current_balances, previous_balances) {
    const current_balances_ = {}
    const previous_balances_ = {}

    if (previous_balances.length) {
        for (const k in previous_balances) {
            previous_balances_[previous_balances[k].asset] = previous_balances[k].balanceQNT
        }
    }

    if (current_balances.length) {
        for (const k in current_balances) {
            current_balances_[current_balances[k].asset] = current_balances[k].balanceQNT
        }
    }

    const diff = {}

    for (const k in previous_balances_) {
        if (!(k in current_balances_)) {
            diff[k] = '-' + previous_balances_[k]
        } else if (previous_balances_[k] !== current_balances_[k]) {
            const change = (new BigInteger(current_balances_[k]).subtract(new BigInteger(previous_balances_[k]))).toString()
            diff[k] = change
        }
    }

    for (const k in current_balances_) {
        if (!(k in previous_balances_)) {
            diff[k] = current_balances_[k] // property is new
        }
    }

    const nr = Object.keys(diff).length

    if (nr === 0) {
        return
    }
    if (nr <= 3) {
        for (const k in diff) {
            BRS.sendRequest('getAsset', {
                asset: k,
                _extra: {
                    asset: k,
                    difference: diff[k]
                }
            }, function (asset, input) {
                if (asset.errorCode) {
                    return
                }
                asset.difference = input._extra.difference
                asset.asset = input._extra.asset
                let quantity
                if (asset.difference.charAt(0) != '-') {
                    quantity = BRS.formatQuantity(asset.difference, asset.decimals)

                    if (quantity != '0') {
                        $.notify($.t('you_received_assets', {
                            asset: String(asset.asset).escapeHTML(),
                            name: String(asset.name).escapeHTML(),
                            count: quantity
                        }), { type: 'success' })
                    }
                } else {
                    asset.difference = asset.difference.substring(1)

                    quantity = BRS.formatQuantity(asset.difference, asset.decimals)

                    if (quantity !== '0') {
                        $.notify($.t('you_sold_assets', {
                            asset: String(asset.asset).escapeHTML(),
                            name: String(asset.name).escapeHTML(),
                            count: quantity
                        }), { type: 'success' })
                    }
                }
            })
        }
    } else {
        $.notify($.t('multiple_assets_differences'), { type: 'success' })
    }
}

export function checkLocationHash (password) {
    if (window.location.hash) {
        const hash = window.location.hash.replace('#', '').split(':')
        let $modal
        if (hash.length === 2) {
            if (hash[0] === 'message') {
                $modal = $('#send_message_modal')
            } else if (hash[0] === 'send') {
                $modal = $('#send_money_modal')
            } else if (hash[0] === 'asset') {
                BRS.goToAsset(hash[1])
                return
            } else {
                $modal = ''
            }

            if ($modal) {
                let account_id = String($.trim(hash[1]))
                if (!/^\d+$/.test(account_id) && account_id.indexOf('@') !== 0) {
                    account_id = '@' + account_id
                }

                $modal.find('input[name=recipient]').val(account_id.unescapeHTML()).trigger('blur')
                if (password && typeof password === 'string') {
                    $modal.find('input[name=secretPhrase]').val(password)
                }
                $modal.modal('show')
            }
        }

        window.location.hash = '#'
    }
}

export function updateBlockchainDownloadProgress () {
    let percentage
    if (BRS.state.lastBlockchainFeederHeight && BRS.state.numberOfBlocks < BRS.state.lastBlockchainFeederHeight) {
        percentage = parseInt(Math.round((BRS.state.numberOfBlocks / BRS.state.lastBlockchainFeederHeight) * 100), 10)
    } else {
        percentage = 100
    }

    if (percentage === 100) {
        $('#downloading_blockchain .progress').hide()
    } else {
        $('#downloading_blockchain .progress').show()
        $('#downloading_blockchain .progress-bar').css('width', percentage + '%')
        $('#downloading_blockchain .sr-only').html($.t('percent_complete', {
            percent: percentage
        }))
    }
}

export function checkIfOnAFork () {
    if (!BRS.downloadingBlockchain) {
        let onAFork = true

        if (BRS.blocks && BRS.blocks.length >= 10) {
            for (let i = 0; i < 10; i++) {
                if (BRS.blocks[i].generator != BRS.account) {
                    onAFork = false
                    break
                }
            }
        } else {
            onAFork = false
        }

        if (onAFork) {
            $.notify($.t('fork_warning'), { type: 'danger' })
        }
    }
}

/** Checks if a Number is valid and greater than minimum fee. If not, return minimum fee */
export function checkMinimumFee (value) {
    return (isNaN(value) ? BRS.minimumFeeNumber : (value < BRS.minimumFeeNumber ? BRS.minimumFeeNumber : value))
}

export function showFeeSuggestions (input_fee_field_id, response_span_id, fee_id) {
    $("[name='suggested_fee_spinner']").removeClass('suggested_fee_spinner_display_none')
    BRS.sendRequest('suggestFee', {
    }, function (response) {
        if (!response.errorCode) {
            $(input_fee_field_id).val((response.standard / 100000000))
            $(input_fee_field_id).trigger('change')
            $(response_span_id).html("<span class='margin-left-5' data-i18n='standard_fee'>Standard: <a href='#' class='btn-fee-response' name='suggested_fee_value_" + response_span_id.id + "' data-i18n='[title]click_to_apply'>" + (response.standard / 100000000) + "</a></span> <span class='margin-left-5' data-i18n='cheap_fee'>Cheap: <a href='#' class='btn-fee-response' name='suggested_fee_value_" + response_span_id.id + "' data-i18n='[title]click_to_apply'>" + (response.cheap / 100000000) + "</a></span> <span class='margin-left-5' data-i18n='priority_fee'>Priority: <a href='#' class='btn-fee-response' name='suggested_fee_value_" + response_span_id.id + "' data-i18n='[title]click_to_apply'>" + (response.priority / 100000000) + '</a></span>')
            $("[name='suggested_fee_value_" + response_span_id.id + "']").i18n() // apply locale to DOM after ajax call
            $("[name='suggested_fee_spinner']").addClass('suggested_fee_spinner_display_none')
            $("[name='suggested_fee_value_" + response_span_id.id + "']").on('click', function (e) {
                e.preventDefault()
                $(input_fee_field_id).val($(this).text())
                if (fee_id === undefined) {
                    $(input_fee_field_id).trigger('change')
                } /// / --> for modals with Total field trigger BRS.sendMoneyCalculateTotal
                else {
                    $(fee_id).html($(this).text() + ' ' + BRS.valueSuffix)
                } /// --> for modals without Total field set Fee field
            })
        } else {
            $('#suggested_fee_response').html(response.errorDescription)
            $("[name='suggested_fee_spinner']").addClass('suggested_fee_spinner_display_none')
        }
    })
}

function showAccountSearchResults (accountsList) {
    if (BRS.currentPage !== 'search_results') {
        BRS.goToPage('search_results')
    }
    let items = '<ul>'
    for (const account of accountsList) {
        const accountRS = BRS.convertNumericToRSAccountFormat(account)
        items += `<li><a href="#" data-user="${accountRS}" class="user-info">${accountRS}</a></li>`
    }
    items += '</ul>'
    $('#search_results_ul_container').html(items)
}

function showAssetSearchResults (assets) {
    if (BRS.currentPage !== 'search_results') {
        BRS.goToPage('search_results')
    }
    let items = '<table class="table table-striped">' +
            '<thead><tr>' +
            `<th>${$.t('name')}</th>` +
            `<th>${$.t('asset_id')}</th>` +
            `<th>${$.t('issuer')}</th>` +
            `<th>${$.t('description')}</th>` +
            '</tr></thead><tbody>'
    for (const asset of assets) {
        items += `<tr><td>${asset.name}</td>`
        items += `<td><a href="#" data-goto-asset="${asset.asset}">${asset.asset}</a></td>`
        items += `<td><a href="#" data-user="${asset.accountRS}" class="user-info">${asset.accountRS}</a></td>`
        items += `<td>${String(asset.description).escapeHTML()}</td></tr>`
    }
    items += '</tbody></table>'
    $('#search_results_ul_container').html(items)
}

export function evIdSearchSubmit (e) {
    e.preventDefault()
    const userInput = $.trim($('#id_search input[name=q]').val())
    let searchText = userInput
    if (searchText.startsWith('-')) {
        try {
            // signed to unsigned conversion
            searchText = (BigInt(userInput) + (1n << 64n)).toString(10)
        } catch (_e) {
            searchText = userInput
        }
    }
    if (BRS.rsRegEx.test(searchText)) {
        BRS.sendRequest('getAccount', {
            account: searchText
        }, function (response, input) {
            if (response.errorCode) {
                $.notify($.t('error_search_no_results'), { type: 'danger' })
                return
            }
            response.account = input.account
            BRS.showAccountModal(response)
        })
        return
    }
    if (BRS.idRegEx.test(searchText)) {
        BRS.sendRequest('getTransaction', {
            transaction: searchText
        }, function (response, input) {
            if (response.errorCode) {
                $.notify($.t('error_search_no_results'), { type: 'danger' })
                return
            }
            response.transaction = input.transaction
            BRS.showTransactionModal(response)
        })
        return
    }
    const splitted = searchText.split(':')
    if (splitted.length !== 2) {
        $.notify($.t('error_search_invalid'), { type: 'danger' })
        return
    }
    switch (splitted[0].trim()) {
    case 'a':
    case 'address':
        BRS.sendRequest('getAccount', {
            account: splitted[1].trim()
        }, function (response, input) {
            if (response.errorCode) {
                $.notify($.t('error_search_no_results'), { type: 'danger' })
                return
            }
            response.account = input.account
            BRS.showAccountModal(response)
        })
        return
    case 'b':
    case 'block':
        BRS.sendRequest('getBlock', {
            block: splitted[1].trim(),
            includeTransactions: 'true'
        }, function (response, input) {
            if (!response.errorCode) {
                // response.block = input.block;
                BRS.showBlockModal(response)
            } else {
                BRS.sendRequest('getBlock', {
                    height: splitted[1].trim(),
                    includeTransactions: 'true'
                }, function (response, input) {
                    if (!response.errorCode) {
                        // response.block = input.block;
                        BRS.showBlockModal(response)
                    } else {
                        $.notify($.t('error_search_no_results'), { type: 'danger' })
                    }
                })
            }
        })
        return
    case 'alias':
        BRS.sendRequest('getAlias', {
            aliasName: splitted[1].trim()
        }, function (response) {
            if (response.errorCode) {
                $.notify($.t('error_search_no_results'), { type: 'danger' })
                return
            }
            BRS.evAliasShowSearchResult(response)
        })
        return
    case 'name':
        BRS.sendRequest('getAccountsWithName', {
            name: splitted[1].trim()
        }, function (response) {
            if (response.errorCode || !response.accounts || response.accounts.length === 0) {
                $.notify($.t('error_search_no_results'), { type: 'danger' })
                return
            }
            if (response.accounts.length === 1) {
                BRS.sendRequest('getAccount', {
                    account: response.accounts[0]
                }, function (response2, input) {
                    if (response2.errorCode) {
                        $.notify($.t('error_search_no_results'), { type: 'danger' })
                        return
                    }
                    BRS.showAccountModal(response2)
                })
                return
            }
            // show multi result page
            showAccountSearchResults(response.accounts)
        })
        return
    case 'token':
        BRS.sendRequest('getAssetsByName', {
            name: splitted[1].trim()
        }, function (response) {
            if (response.errorCode || !response.assets || response.assets.length === 0) {
                $.notify($.t('error_search_no_results'), { type: 'danger' })
                return
            }
            showAssetSearchResults(response.assets)
        })
        return
    default:
        $.notify($.t('error_search_invalid'), { type: 'danger' })
    }
}
