/**
 * @depends {brs.js}
 */

import { BRS } from '.'

export function showConsole () {
    BRS.console = window.open('', 'console', 'width=750,height=400,menubar=no,scrollbars=yes,status=no,toolbar=no,resizable=yes')
    $(BRS.console.document.head).html('<title>' + $.t('console') + "</title><style type='text/css'>body { background:black; color:white; font-family:courier-new,courier;font-size:14px; } pre { font-size:14px; } #console { padding-top:15px; }</style>")
    $(BRS.console.document.body).html("<div style='position:fixed;top:0;left:0;right:0;padding:5px;background:#efefef;color:black;'>" + $.t('console_opened') + "<div style='float:right;text-decoration:underline;color:blue;font-weight:bold;cursor:pointer;' onclick='document.getElementById(\"console\").innerHTML=\"\"'>clear</div></div><div id='console'></div>")
}

export function addToConsole (url, type, data, response, error) {
    if (!BRS.console) {
        return
    }

    if (!BRS.console.document || !BRS.console.document.body) {
        BRS.console = null
        return
    }

    // rico666: see also brs.server.js (line ~ 188 ff)
    // there it is added, here supposedly removed - but somehow doesn't get removed
    // weird shit...
    // url = url.replace(/&random=[\.\d]+/, "", url);

    addToConsoleBody(url + ' (' + type + ') ' + new Date().toString(), 'url')

    if (data) {
        if (typeof data === 'string') {
            const d = queryStringToObject(data)
            addToConsoleBody(JSON.stringify(d, null, '\t'), 'post')
        } else {
            addToConsoleBody(JSON.stringify(data, null, '\t'), 'post')
        }
    }

    if (error) {
        addToConsoleBody(response, 'error')
    } else {
        addToConsoleBody(JSON.stringify(response, null, '\t'), (response.errorCode ? 'error' : ''))
    }
}

function addToConsoleBody (text, type) {
    let color = ''

    switch (type) {
    case 'url':
        color = '#29FD2F'
        break
    case 'post':
        color = 'lightgray'
        break
    case 'error':
        color = 'red'
        break
    }

    $(BRS.console.document.body).find('#console').append('<pre' + (color ? " style='color:" + color + "'" : '') + '>' + text.escapeHTML() + '</pre>')
}

function queryStringToObject (qs) {
    qs = qs.split('&')

    if (!qs) {
        return {}
    }

    const obj = {}

    for (let i = 0; i < qs.length; ++i) {
        const p = qs[i].split('=')

        if (p.length !== 2) {
            continue
        }

        obj[p[0]] = decodeURIComponent(p[1].replace(/\+/g, ' '))
    }

    if ('secretPhrase' in obj) {
        obj.secretPhrase = '***'
    }

    return obj
}
