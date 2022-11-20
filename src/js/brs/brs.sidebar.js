/**
 * @depends {brs.js}
 * Reverted from BRS version 2.0.4
 */

/* global $ */

import { BRS } from '.'

export function evSidebarContextOnContextmenu (e) {
    e.preventDefault()

    if (!BRS.databaseSupport) {
        return
    }

    closeContextMenu()

    if ($(this).hasClass('no-context')) {
        return
    }

    BRS.selectedContext = $(this)

    BRS.selectedContext.addClass('context')

    $(document).on('click.contextmenu', closeContextMenu)

    let contextMenu = $(this).data('context')

    if (!contextMenu) {
        contextMenu = $(this).closest('.list-group').attr('id') + '_context'
    }

    const $contextMenu = $('#' + contextMenu)

    if ($contextMenu.length) {
        const $options = $contextMenu.find('ul.dropdown-menu a')

        $.each($options, function () {
            const requiredClass = $(this).data('class')

            if (!requiredClass) {
                $(this).show()
            } else if (BRS.selectedContext.hasClass(requiredClass)) {
                $(this).show()
            } else {
                $(this).hide()
            }
        })

        $contextMenu.css({
            display: 'block',
            left: e.pageX,
            top: e.pageY
        })
    }

    return false
}

export function closeContextMenu (e) {
    if (e && e.which === 3) {
        return
    }

    $('.context_menu').hide()

    if (BRS.selectedContext) {
        BRS.selectedContext.removeClass('context')
        // BRS.selectedContext = null;
    }

    $(document).off('click.contextmenu')
}
