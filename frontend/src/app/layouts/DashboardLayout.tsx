import { prefetchRoute } from '../routeLoaders'
import {
  Activity,
  Bell,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Search,
  Settings,
} from 'lucide-react'
import type { FormEvent, MouseEvent as ReactMouseEvent, PointerEvent as ReactPointerEvent, ReactNode, WheelEvent } from 'react'
import { Suspense, useEffect, useRef, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { useAuth } from '../../features/auth/components/AuthContext'
import { useClinicBrand } from '../../shared/clinic/clinicBrand'
import { getVisibleNavigationItems, resolvePrimaryRole } from './navigation'

type DashboardLayoutProps = {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate()
  const navRef = useRef<HTMLElement>(null)
  const navDragRef = useRef({
    isPointerDown: false,
    hasDragged: false,
    suppressClick: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    lastX: 0,
  })
  const navScrollFrameRef = useRef<number | null>(null)
  const navMomentumFrameRef = useRef<number | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [isDraggingNav, setIsDraggingNav] = useState(false)
  const [workspaceSearch, setWorkspaceSearch] = useState('')
  const [searchNotice, setSearchNotice] = useState('')
  const [showNotifications, setShowNotifications] = useState(false)
  const { logout, user, liveUpdatesUnavailable } = useAuth()
  const { brand } = useClinicBrand()
  const roles = user?.roles ?? []
  const visibleItems = getVisibleNavigationItems(roles)
  const primaryRole = resolvePrimaryRole(roles) ?? 'USER'

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  function handleWorkspaceSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const query = workspaceSearch.trim().toLowerCase()
    if (!query) return
    const match = visibleItems.find((item) => item.label.toLowerCase().includes(query))
    if (match) {
      setSearchNotice('')
      setWorkspaceSearch('')
      navigate(match.path)
      return
    }
    setSearchNotice('No page matches that search.')
  }

  function handleNavWheel(event: WheelEvent<HTMLElement>) {
    const nav = navRef.current

    if (!nav || nav.scrollWidth <= nav.clientWidth) {
      return
    }

    event.preventDefault()
    nav.scrollLeft += Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY
    scheduleNavScrollState()
  }

  function handleNavPointerDown(event: ReactPointerEvent<HTMLElement>) {
    // Native touch scrolling preserves Safari momentum and avoids capture/cancel
    // races when a swipe starts on a link. Keep custom dragging for a mouse.
    if (event.pointerType !== 'mouse') {
      resetNavDrag(true)
      return
    }
    const nav = navRef.current
    if (!nav || nav.scrollWidth <= nav.clientWidth || (event.pointerType === 'mouse' && event.button !== 0)) {
      return
    }

    stopNavMomentum()
    navDragRef.current = {
      isPointerDown: true,
      hasDragged: false,
      suppressClick: false,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
    }
  }

  function handleNavPointerMove(event: ReactPointerEvent<HTMLElement>) {
    const nav = navRef.current
    const drag = navDragRef.current
    if (!nav || !drag.isPointerDown || drag.pointerId !== event.pointerId) {
      return
    }

    if (event.pointerType === 'mouse' && event.buttons !== 1) {
      endNavDrag(event)
      return
    }

    const totalDeltaX = event.clientX - drag.startX
    const totalDeltaY = event.clientY - drag.startY
    const isSwipe = Math.abs(totalDeltaX) > 14 && Math.abs(totalDeltaX) > Math.abs(totalDeltaY) * 1.25

    if (!drag.hasDragged && isSwipe) {
      drag.hasDragged = true
      drag.suppressClick = true
      event.currentTarget.setPointerCapture(event.pointerId)
      setIsDraggingNav(true)
    }

    if (drag.hasDragged) {
      const deltaX = event.clientX - drag.lastX
      event.preventDefault()
      event.stopPropagation()
      nav.scrollLeft -= deltaX
      scheduleNavScrollState()
    }

    drag.lastX = event.clientX
  }

  function resetNavDrag(clearClickSuppression = false) {
    const drag = navDragRef.current
    navDragRef.current.isPointerDown = false
    navDragRef.current.pointerId = -1
    navDragRef.current.hasDragged = false
    if (clearClickSuppression) {
      drag.suppressClick = false
    }
    setIsDraggingNav(false)
    scheduleNavScrollState()
  }

  function endNavDrag(event: ReactPointerEvent<HTMLElement>) {
    const drag = navDragRef.current
    if (!drag.isPointerDown || drag.pointerId !== event.pointerId) {
      return
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    resetNavDrag()
  }

  function handleNavClickCapture(event: ReactMouseEvent<HTMLElement>) {
    if (!navDragRef.current.suppressClick) {
      return
    }

    event.preventDefault()
    event.stopPropagation()
    resetNavDrag(true)
  }

  function updateNavScrollState() {
    navScrollFrameRef.current = null
    const nav = navRef.current
    if (!nav) {
      return
    }

    const maxScroll = nav.scrollWidth - nav.clientWidth
    setCanScrollLeft(nav.scrollLeft > 2)
    setCanScrollRight(nav.scrollLeft < maxScroll - 2)
  }

  function scheduleNavScrollState() {
    if (navScrollFrameRef.current !== null) {
      return
    }

    navScrollFrameRef.current = window.requestAnimationFrame(updateNavScrollState)
  }

  function stopNavMomentum() {
    if (navMomentumFrameRef.current === null) {
      return
    }

    window.cancelAnimationFrame(navMomentumFrameRef.current)
    navMomentumFrameRef.current = null
  }

  function scrollNavigation(direction: 'left' | 'right') {
    const nav = navRef.current
    if (!nav) {
      return
    }

    nav.scrollBy({
      left: direction === 'left' ? -260 : 260,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    updateNavScrollState()
    window.addEventListener('resize', scheduleNavScrollState)

    function handleWindowPointerEnd() {
      if (navDragRef.current.isPointerDown) {
        resetNavDrag(!navDragRef.current.hasDragged)
      }
    }

    window.addEventListener('pointerup', handleWindowPointerEnd)
    window.addEventListener('pointercancel', handleWindowPointerEnd)
    window.addEventListener('blur', handleWindowPointerEnd)

    return () => {
      window.removeEventListener('resize', scheduleNavScrollState)
      window.removeEventListener('pointerup', handleWindowPointerEnd)
      window.removeEventListener('pointercancel', handleWindowPointerEnd)
      window.removeEventListener('blur', handleWindowPointerEnd)
      stopNavMomentum()
      if (navScrollFrameRef.current !== null) {
        window.cancelAnimationFrame(navScrollFrameRef.current)
      }
    }
  }, [visibleItems.length])

  return (
    <div className="app-shell">
      <div className="mediflex-shell">
        <header className="topbar">
          <div className="brand">
            <div className="brand-mark">
              {brand.logoUrl ? <img alt={`${brand.clinicName} logo`} src={brand.logoUrl} /> : <Activity size={22} aria-hidden="true" />}
            </div>
            <div>
              <strong>{brand.clinicName}</strong>
              <span>{primaryRole}</span>
            </div>
          </div>

          <div className="nav-rail">
            <button
              aria-label="Scroll navigation left"
              className="nav-scroll-button"
              disabled={!canScrollLeft}
              onClick={() => scrollNavigation('left')}
              type="button"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </button>
            <nav
              className={isDraggingNav ? 'nav-list dragging' : 'nav-list'}
              aria-label="Role-based navigation"
              onClickCapture={handleNavClickCapture}
              onPointerCancel={endNavDrag}
              onPointerDown={handleNavPointerDown}
              onPointerMove={handleNavPointerMove}
              onPointerLeave={endNavDrag}
              onPointerUp={endNavDrag}
              onScroll={scheduleNavScrollState}
              onWheel={handleNavWheel}
              ref={navRef}
            >
              {visibleItems.map((item) => {
                return (
                  <NavLink
                    className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
                    end={item.path === '/app'}
                    key={item.label}
                    to={item.path}
                    title={item.label}
                    onPointerEnter={() => prefetchRoute(item.path)}
                    onFocus={() => prefetchRoute(item.path)}
                    onTouchStart={() => prefetchRoute(item.path)}
                    draggable={false}
                    onDragStart={(event) => event.preventDefault()}
                  >
                    <item.icon size={16} aria-hidden="true" />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </nav>
            <button
              aria-label="Scroll navigation right"
              className="nav-scroll-button"
              disabled={!canScrollRight}
              onClick={() => scrollNavigation('right')}
              type="button"
            >
              <ChevronRight size={16} aria-hidden="true" />
            </button>
          </div>

          <div className="topbar-actions">
            <form className="search-control" onSubmit={handleWorkspaceSearch} role="search">
              <Search size={16} aria-hidden="true" />
              <input aria-label="Find a workspace" placeholder="Go to page..." type="search" value={workspaceSearch} onChange={(event) => { setWorkspaceSearch(event.target.value); setSearchNotice('') }} />
            </form>
            <button className="icon-button" onClick={() => navigate('/app/settings')} type="button" aria-label="Settings">
              <Settings size={17} aria-hidden="true" />
            </button>
            <button aria-expanded={showNotifications} className="icon-button" onClick={() => setShowNotifications((current) => !current)} type="button" aria-label="Notifications">
              <Bell size={17} aria-hidden="true" />
            </button>
            <button className="avatar-button" onClick={handleLogout} type="button" title="Sign out">
              <span>{user?.fullName?.charAt(0) ?? 'U'}</span>
              <strong>{primaryRole}</strong>
              <LogOut size={15} aria-hidden="true" />
            </button>
            {searchNotice ? <div className="topbar-popover" role="status">{searchNotice}</div> : null}
            {showNotifications ? <div className="topbar-popover notification-popover" role="status"><strong>No new alerts</strong><span>You’re all caught up.</span></div> : null}
          </div>
        </header>

        {liveUpdatesUnavailable && <div className="form-alert" role="status">Live updates are unavailable from the server. Your work stays open; reconnection will be retried automatically.</div>}
        <main className="main-surface"><Suspense fallback={<div className="route-loading" role="status">Loading workspace…</div>}>{children}</Suspense></main>
      </div>
    </div>
  )
}
