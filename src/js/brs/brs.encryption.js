/**
 * @depends {brs.js}
 */
var BRS = (function (BRS, $, undefined) {
    let _password
    let _decryptionPassword
    const _decryptedTransactions = {}
    let _encryptedNote = null
    const _sharedKeys = {}

    const _hash = {
        init: SHA256_init,
        update: SHA256_write,
        getBytes: SHA256_finalize
    }

    BRS.generatePublicKey = function (secretPhrase) {
        if (!secretPhrase) {
	    if (BRS.rememberPassword) {
                secretPhrase = _password
	    } else {
		    throw $.t('error_generate_public_key_no_password')
	    }
        }

        return BRS.getPublicKey(converters.stringToHexString(secretPhrase))
    }

    BRS.getPublicKey = function (secretPhrase, isAccountNumber) {
        if (isAccountNumber) {
	    const accountNumber = secretPhrase
	    let publicKey = ''

	    // synchronous!
	    BRS.sendRequest('getAccountPublicKey', {
                account: accountNumber
	    }, function (response) {
                if (!response.publicKey) {
		    throw $.t('error_no_public_key')
                } else {
		    publicKey = response.publicKey
                }
	    }, false)

	    return publicKey
        } else {
	    const secretPhraseBytes = converters.hexStringToByteArray(secretPhrase)
	    const digest = simpleHash(secretPhraseBytes)
	    return converters.byteArrayToHexString(curve25519.keygen(digest).p)
        }
    }

    BRS.getPrivateKey = function (secretPhrase) {
        SHA256_init()
        SHA256_write(converters.stringToByteArray(secretPhrase))
        return converters.shortArrayToHexString(curve25519_clamp(converters.byteArrayToShortArray(SHA256_finalize())))
    }

    BRS.getAccountId = function (secretPhrase) {
        return BRS.getAccountIdFromPublicKey(BRS.getPublicKey(converters.stringToHexString(secretPhrase)))
    }

    BRS.getAccountIdFromPublicKey = function (publicKey, RSFormat) {
        const hex = converters.hexStringToByteArray(publicKey)

        _hash.init()
        _hash.update(hex)

        let account = _hash.getBytes()

        account = converters.byteArrayToHexString(account)

        const slice = (converters.hexStringToByteArray(account)).slice(0, 8)

        const accountId = byteArrayToBigInteger(slice).toString()

        if (RSFormat) {
	    const address = new NxtAddress()

	    if (address.set(accountId)) {
                return address.toString()
	    } else {
                return ''
	    }
        } else {
	    return accountId
        }
    }

    BRS.encryptNote = function (message, options, secretPhrase) {
        try {
	    if (!options.sharedKey) {
                if (!options.privateKey) {
		    if (!secretPhrase) {
                        if (BRS.rememberPassword) {
			    secretPhrase = _password
                        } else {
			    throw {
                                message: $.t('error_encryption_passphrase_required'),
                                errorCode: 1
			    }
                        }
		    }

		    options.privateKey = converters.hexStringToByteArray(BRS.getPrivateKey(secretPhrase))
                }

                if (!options.publicKey) {
		    if (!options.account) {
                        throw {
			    message: $.t('error_account_id_not_specified'),
			    errorCode: 2
                        }
		    }

		    try {
                        options.publicKey = converters.hexStringToByteArray(BRS.getPublicKey(options.account, true))
		    } catch (err) {
                        const nxtAddress = new NxtAddress()

                        if (!nxtAddress.set(options.account)) {
			    throw {
                                message: $.t('error_invalid_account_id'),
                                errorCode: 3
			    }
                        } else {
			    throw {
                                message: $.t('error_public_key_not_specified'),
                                errorCode: 4
			    }
                        }
		    }
                } else if (typeof options.publicKey === 'string') {
		    options.publicKey = converters.hexStringToByteArray(options.publicKey)
                }
	    }

	    const encrypted = encryptData(converters.stringToByteArray(message), options)

	    return {
                message: converters.byteArrayToHexString(encrypted.data),
                nonce: converters.byteArrayToHexString(encrypted.nonce)
	    }
        } catch (err) {
	    if (err.errorCode && err.errorCode < 5) {
                throw err
	    } else {
                throw {
		    message: $.t('error_message_encryption'),
		    errorCode: 5
                }
	    }
        }
    }

    BRS.decryptData = function (data, options, secretPhrase) {
        try {
	    return BRS.decryptNote(message, options, secretPhrase)
        } catch (err) {
	    const mesage = String(err.message ? err.message : err)

	    if (err.errorCode && err.errorCode == 1) {
                return false
	    } else {
                if (options.title) {
		    let translatedTitle = BRS.getTranslatedFieldName(options.title).toLowerCase()
		    if (!translatedTitle) {
                        translatedTitle = String(options.title).escapeHTML().toLowerCase()
		    }

		    return $.t('error_could_not_decrypt_var', {
                        var: translatedTitle
		    }).capitalize()
                } else {
		    return $.t('error_could_not_decrypt')
                }
	    }
        }
    }

    BRS.decryptNote = function (message, options, secretPhrase) {
        try {
	    if (!options.sharedKey) {
                if (!options.privateKey) {
		    if (!secretPhrase) {
                        if (BRS.rememberPassword) {
			    secretPhrase = _password
                        } else if (_decryptionPassword) {
			    secretPhrase = _decryptionPassword
                        } else {
			    throw {
                                message: $.t('error_decryption_passphrase_required'),
                                errorCode: 1
			    }
                        }
		    }

		    options.privateKey = converters.hexStringToByteArray(BRS.getPrivateKey(secretPhrase))
                }

                if (!options.publicKey) {
		    if (!options.account) {
                        throw {
			    message: $.t('error_account_id_not_specified'),
			    errorCode: 2
                        }
		    }

		    options.publicKey = converters.hexStringToByteArray(BRS.getPublicKey(options.account, true))
                }
	    }

	    options.nonce = converters.hexStringToByteArray(options.nonce)

	    return decryptData(converters.hexStringToByteArray(message), options)
        } catch (err) {
	    if (err.errorCode && err.errorCode < 3) {
                throw err
	    } else {
                throw {
		    message: $.t('error_message_decryption'),
		    errorCode: 3
                }
	    }
        }
    }

    BRS.getSharedKeyWithAccount = function (account) {
        try {
	    if (account in _sharedKeys) {
                return _sharedKeys[account]
	    }

	    let secretPhrase

	    if (BRS.rememberPassword) {
                secretPhrase = _password
	    } else if (_decryptionPassword) {
                secretPhrase = _decryptionPassword
	    } else {
                throw {
		    message: $.t('error_passphrase_required'),
		    errorCode: 3
                }
	    }

	    const privateKey = converters.hexStringToByteArray(BRS.getPrivateKey(secretPhrase))

	    const publicKey = converters.hexStringToByteArray(BRS.getPublicKey(account, true))

	    const sharedKey = getSharedKey(privateKey, publicKey)

	    const sharedKeys = Object.keys(_sharedKeys)

	    if (sharedKeys.length > 50) {
                delete _sharedKeys[sharedKeys[0]]
	    }

	    _sharedKeys[account] = sharedKey
        } catch (err) {
	    throw err
        }
    }

    BRS.signBytes = function (message, secretPhrase) {
        const messageBytes = converters.hexStringToByteArray(message)
        const secretPhraseBytes = converters.hexStringToByteArray(secretPhrase)

        const digest = simpleHash(secretPhraseBytes)
        const s = curve25519.keygen(digest).s

        const m = simpleHash(messageBytes)

        _hash.init()
        _hash.update(m)
        _hash.update(s)
        const x = _hash.getBytes()

        const y = curve25519.keygen(x).p

        _hash.init()
        _hash.update(m)
        _hash.update(y)
        const h = _hash.getBytes()

        const v = curve25519.sign(h, x, s)

        return converters.byteArrayToHexString(v.concat(h))
    }

    BRS.verifyBytes = function (signature, message, publicKey) {
        const signatureBytes = converters.hexStringToByteArray(signature)
        const messageBytes = converters.hexStringToByteArray(message)
        const publicKeyBytes = converters.hexStringToByteArray(publicKey)
        const v = signatureBytes.slice(0, 32)
        const h = signatureBytes.slice(32)
        const y = curve25519.verify(v, h, publicKeyBytes)

        const m = simpleHash(messageBytes)

        _hash.init()
        _hash.update(m)
        _hash.update(y)
        const h2 = _hash.getBytes()

        return areByteArraysEqual(h, h2)
    }

    BRS.setEncryptionPassword = function (password) {
        _password = password
    }

    BRS.getEncryptionPassword = function () {
        return _password
    }

    BRS.setDecryptionPassword = function (password) {
        _decryptionPassword = password
    }

    BRS.addDecryptedTransaction = function (identifier, content) {
        if (!_decryptedTransactions[identifier]) {
	    _decryptedTransactions[identifier] = content
        }
    }

    BRS.tryToDecryptMessage = function (message) {
        if (_decryptedTransactions && _decryptedTransactions[message.transaction]) {
	    return _decryptedTransactions[message.transaction].encryptedMessage
        }

        try {
	    if (!message.attachment.encryptedMessage.data) {
                return $.t('message_empty')
	    } else {
                var decoded = BRS.decryptNote(message.attachment.encryptedMessage.data, {
		    nonce: message.attachment.encryptedMessage.nonce,
		    account: (message.recipient == BRS.account ? message.sender : message.recipient)
                })
	    }

	    return decoded
        } catch (err) {
	    throw err
        }
    }

    BRS.tryToDecrypt = function (transaction, fields, account, options) {
        let showDecryptionForm = false

        if (!options) {
	    options = {}
        }

        const nrFields = Object.keys(fields).length

        const formEl = (options.formEl ? String(options.formEl).escapeHTML() : '#transaction_info_output_bottom')
        const outputEl = (options.outputEl ? String(options.outputEl).escapeHTML() : '#transaction_info_output_bottom')

        let output = ''

        const identifier = (options.identifier ? transaction[options.identifier] : transaction.transaction)

        // check in cache first..
        if (_decryptedTransactions && _decryptedTransactions[identifier]) {
	    const decryptedTransaction = _decryptedTransactions[identifier]

	    $.each(fields, function (key, title) {
                if (typeof title !== 'string') {
		    title = title.title
                }

                if (key in decryptedTransaction) {
		    output += "<div style='" + (!options.noPadding && title ? 'padding-left:5px;' : '') + "'>" + (title ? '<label' + (nrFields > 1 ? " style='margin-top:5px'" : '') + "><i class='fas fa-lock'></i> " + String(title).escapeHTML() + '</label>' : '') + "<div class='modal-text-box'>" + String(decryptedTransaction[key]).escapeHTML().nl2br() + '</div></div>'
                } else {
		    // if a specific key was not found, the cache is outdated..
		    output = ''
		    delete _decryptedTransactions[identifier]
		    return false
                }
	    })
        }

        if (!output) {
	    $.each(fields, function (key, title) {
                let data = ''

                let encrypted = ''
                let nonce = ''
                const nonceField = (typeof title !== 'string' ? title.nonce : key + 'Nonce')

                if (key == 'encryptedMessage' || key == 'encryptToSelfMessage') {
		    encrypted = transaction.attachment[key].data
		    nonce = transaction.attachment[key].nonce
                } else if (transaction.attachment && transaction.attachment[key]) {
		    encrypted = transaction.attachment[key]
		    nonce = transaction.attachment[nonceField]
                } else if (transaction[key] && typeof transaction[key] === 'object') {
		    encrypted = transaction[key].data
		    nonce = transaction[key].nonce
                } else if (transaction[key]) {
		    encrypted = transaction[key]
		    nonce = transaction[nonceField]
                } else {
		    encrypted = ''
                }

                if (encrypted) {
		    if (typeof title !== 'string') {
                        title = title.title
		    }

		    try {
                        let destinationAccount = account
                        if (key === 'encryptToSelfMessage') {
                            destinationAccount = BRS.account
                        }
                        data = BRS.decryptNote(encrypted, {
			    nonce,
			    account: destinationAccount
                        })
		    } catch (err) {
                        const mesage = String(err.message ? err.message : err)
                        if (err.errorCode && err.errorCode == 1) {
			    showDecryptionForm = true
			    return false
                        } else {
			    if (title) {
                                let translatedTitle = BRS.getTranslatedFieldName(title).toLowerCase()
                                if (!translatedTitle) {
				    translatedTitle = String(title).escapeHTML().toLowerCase()
                                }

                                data = $.t('error_could_not_decrypt_var', {
				    var: translatedTitle
                                }).capitalize()
			    } else {
                                data = $.t('error_could_not_decrypt')
			    }
                        }
		    }

		    output += "<div style='" + (!options.noPadding && title ? 'padding-left:5px;' : '') + "'>" + (title ? '<label' + (nrFields > 1 ? " style='margin-top:5px'" : '') + "><i class='fas fa-lock'></i> " + String(title).escapeHTML() + '</label>' : '') + "<div class='modal-text-box'>" + String(data).escapeHTML().nl2br() + '</div></div>'
                }
	    })
        }

        if (showDecryptionForm) {
	    _encryptedNote = {
                transaction,
                fields,
                account,
                options,
                identifier
	    }

	    $('#decrypt_note_form_container').detach().appendTo(formEl)

	    $('#decrypt_note_form_container, ' + formEl).show()
        } else {
	    BRS.removeDecryptionForm()
	    $(outputEl).append(output).show()
        }
    }

    BRS.removeDecryptionForm = function ($modal) {
        if (($modal && $modal.find('#decrypt_note_form_container').length) || (!$modal && $('#decrypt_note_form_container').length)) {
	    $('#decrypt_note_form_container input').val('')
	    $('#decrypt_note_form_container').find('.callout').html($.t('passphrase_required_to_decrypt_data'))
	    $('#decrypt_note_form_container').hide().detach().appendTo('body')
        }
    }

    BRS.decryptNoteFormSubmit = function () {
        const $form = $('#decrypt_note_form_container')

        if (!_encryptedNote) {
	    $form.find('.callout').html($.t('error_encrypted_note_not_found')).show()
	    return
        }

        let password = $form.find('input[name=secretPhrase]').val()

        if (!password) {
	    if (BRS.rememberPassword) {
                password = _password
	    } else if (_decryptionPassword) {
                password = _decryptionPassword
	    } else {
                $form.find('.callout').html($.t('error_passphrase_required')).show()
                return
	    }
        }

        const accountId = BRS.getAccountId(password)
        if (accountId != BRS.account) {
	    $form.find('.callout').html($.t('error_incorrect_passphrase')).show()
	    return
        }

        const rememberPassword = $form.find('input[name=rememberPassword]').is(':checked')

        const otherAccount = _encryptedNote.account

        let output = ''
        let decryptionError = false
        const decryptedFields = {}

        const inAttachment = ('attachment' in _encryptedNote.transaction)

        const nrFields = Object.keys(_encryptedNote.fields).length

        $.each(_encryptedNote.fields, function (key, title) {
	    let data = ''

	    let encrypted = ''
	    let nonce = ''
	    const nonceField = (typeof title !== 'string' ? title.nonce : key + 'Nonce')

	    if (key == 'encryptedMessage' || key == 'encryptToSelfMessage') {
                encrypted = _encryptedNote.transaction.attachment[key].data
                nonce = _encryptedNote.transaction.attachment[key].nonce
	    } else if (_encryptedNote.transaction.attachment && _encryptedNote.transaction.attachment[key]) {
                encrypted = _encryptedNote.transaction.attachment[key]
                nonce = _encryptedNote.transaction.attachment[nonceField]
	    } else if (_encryptedNote.transaction[key] && typeof _encryptedNote.transaction[key] === 'object') {
                encrypted = _encryptedNote.transaction[key].data
                nonce = _encryptedNote.transaction[key].nonce
	    } else if (_encryptedNote.transaction[key]) {
                encrypted = _encryptedNote.transaction[key]
                nonce = _encryptedNote.transaction[nonceField]
	    } else {
                encrypted = ''
	    }

	    if (encrypted) {
                if (typeof title !== 'string') {
		    title = title.title
                }

                try {
                    let destinationAccount = otherAccount
                    if (key === 'encryptToSelfMessage') {
                        destinationAccount = BRS.account
                    }
		    data = BRS.decryptNote(encrypted, {
                        nonce,
                        account: destinationAccount
		    }, password)

		    decryptedFields[key] = data
                } catch (err) {
		    decryptionError = true
		    const message = String(err.message ? err.message : err)

		    $form.find('.callout').html(message.escapeHTML())
		    return false
                }

                output += "<div style='" + (!_encryptedNote.options.noPadding && title ? 'padding-left:5px;' : '') + "'>" + (title ? '<label' + (nrFields > 1 ? " style='margin-top:5px'" : '') + "><i class='fas fa-lock'></i> " + String(title).escapeHTML() + '</label>' : '') + "<div class='modal-text-box'>" + String(data).escapeHTML().nl2br() + '</div></div>'
	    }
        })

        if (decryptionError) {
	    return
        }

        _decryptedTransactions[_encryptedNote.identifier] = decryptedFields

        // only save 150 decryptions maximum in cache...
        const decryptionKeys = Object.keys(_decryptedTransactions)

        if (decryptionKeys.length > 150) {
	    delete _decryptedTransactions[decryptionKeys[0]]
        }

        BRS.removeDecryptionForm()

        const outputEl = (_encryptedNote.options.outputEl ? String(_encryptedNote.options.outputEl).escapeHTML() : '#transaction_info_output_bottom')

        $(outputEl).append(output).show()

        _encryptedNote = null

        if (rememberPassword) {
	    _decryptionPassword = password
        }
    }

    BRS.decryptAllMessages = function (messages, password) {
        if (!password) {
	    throw {
                message: $.t('error_passphrase_required'),
                errorCode: 1
	    }
        } else {
	    const accountId = BRS.getAccountId(password)
	    if (accountId != BRS.account) {
                throw {
		    message: $.t('error_incorrect_passphrase'),
		    errorCode: 2
                }
	    }
        }

        let success = 0
        let error = 0

        for (let i = 0; i < messages.length; i++) {
	    const message = messages[i]

	    if (message.attachment.encryptedMessage && !_decryptedTransactions[message.transaction]) {
                try {
		    const otherUser = (message.sender == BRS.account ? message.recipient : message.sender)

		    const decoded = BRS.decryptNote(message.attachment.encryptedMessage.data, {
                        nonce: message.attachment.encryptedMessage.nonce,
                        account: otherUser
		    }, password)

		    _decryptedTransactions[message.transaction] = {
                        encryptedMessage: decoded
		    }

		    success++
                } catch (err) {
		    _decryptedTransactions[message.transaction] = {
                        encryptedMessage: $.t('error_decryption_unknown')
		    }
		    error++
                }
	    }
        }

        if (success || !error) {
	    return true
        } else {
	    return false
        }
    }

    function simpleHash (message) {
        _hash.init()
        _hash.update(message)
        return _hash.getBytes()
    }

    function areByteArraysEqual (bytes1, bytes2) {
        if (bytes1.length !== bytes2.length) {
            return false
        }

        for (let i = 0; i < bytes1.length; ++i) {
	    if (bytes1[i] !== bytes2[i]) {
                return false
            }
        }

        return true
    }

    function curve25519_clamp (curve) {
        curve[0] &= 0xFFF8
        curve[15] &= 0x7FFF
        curve[15] |= 0x4000
        return curve
    }

    function byteArrayToBigInteger (byteArray, startIndex) {
        let value = new BigInteger('0', 10)
        let temp1, temp2
        for (let i = byteArray.length - 1; i >= 0; i--) {
	    temp1 = value.multiply(new BigInteger('256', 10))
	    temp2 = temp1.add(new BigInteger(byteArray[i].toString(10), 10))
	    value = temp2
        }

        return value
    }

    function aesEncrypt (plaintext, options) {
        if (!window.crypto && !window.msCrypto) {
	    throw {
                errorCode: -1,
                message: $.t('error_encryption_browser_support')
	    }
        }

        // CryptoJS likes WordArray parameters
        const text = converters.byteArrayToWordArray(plaintext)

        if (!options.sharedKey) {
	    var sharedKey = getSharedKey(options.privateKey, options.publicKey)
        } else {
	    var sharedKey = options.sharedKey.slice(0) // clone
        }

        for (let i = 0; i < 32; i++) {
	    sharedKey[i] ^= options.nonce[i]
        }

        const key = CryptoJS.SHA256(converters.byteArrayToWordArray(sharedKey))

        const tmp = new Uint8Array(16)

        if (window.crypto) {
	    window.crypto.getRandomValues(tmp)
        } else {
	    window.msCrypto.getRandomValues(tmp)
        }

        const iv = converters.byteArrayToWordArray(tmp)
        const encrypted = CryptoJS.AES.encrypt(text, key, {
	    iv
        })

        const ivOut = converters.wordArrayToByteArray(encrypted.iv)

        const ciphertextOut = converters.wordArrayToByteArray(encrypted.ciphertext)

        return ivOut.concat(ciphertextOut)
    }

    function aesDecrypt (ivCiphertext, options) {
        if (ivCiphertext.length < 16 || ivCiphertext.length % 16 != 0) {
	    throw {
                name: 'invalid ciphertext'
	    }
        }

        const iv = converters.byteArrayToWordArray(ivCiphertext.slice(0, 16))
        const ciphertext = converters.byteArrayToWordArray(ivCiphertext.slice(16))

        if (!options.sharedKey) {
	    var sharedKey = getSharedKey(options.privateKey, options.publicKey)
        } else {
	    var sharedKey = options.sharedKey.slice(0) // clone
        }

        for (let i = 0; i < 32; i++) {
	    sharedKey[i] ^= options.nonce[i]
        }

        const key = CryptoJS.SHA256(converters.byteArrayToWordArray(sharedKey))

        const encrypted = CryptoJS.lib.CipherParams.create({
	    ciphertext,
	    iv,
	    key
        })

        const decrypted = CryptoJS.AES.decrypt(encrypted, key, {
	    iv
        })

        const plaintext = converters.wordArrayToByteArray(decrypted)

        return plaintext
    }

    function encryptData (plaintext, options) {
        if (!window.crypto && !window.msCrypto) {
	    throw {
                errorCode: -1,
                message: $.t('error_encryption_browser_support')
	    }
        }

        if (!options.sharedKey) {
	    options.sharedKey = getSharedKey(options.privateKey, options.publicKey)
        }

        const compressedPlaintext = pako.gzip(new Uint8Array(plaintext))

        options.nonce = new Uint8Array(32)

        if (window.crypto) {
	    window.crypto.getRandomValues(options.nonce)
        } else {
	    window.msCrypto.getRandomValues(options.nonce)
        }

        const data = aesEncrypt(compressedPlaintext, options)

        return {
	    nonce: options.nonce,
	    data
        }
    }

    function decryptData (data, options) {
        if (!options.sharedKey) {
	    options.sharedKey = getSharedKey(options.privateKey, options.publicKey)
        }

        const compressedPlaintext = aesDecrypt(data, options)

        const binData = new Uint8Array(compressedPlaintext)

        var data = pako.inflate(binData)

        return converters.byteArrayToString(data)
    }

    function getSharedKey (key1, key2) {
        return converters.shortArrayToByteArray(curve25519_(converters.byteArrayToShortArray(key1), converters.byteArrayToShortArray(key2), null))
    }

    return BRS
}(BRS || {}, jQuery))
