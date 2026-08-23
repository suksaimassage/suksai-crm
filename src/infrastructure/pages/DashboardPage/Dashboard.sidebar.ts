/**
 * Dashboard.sidebar.ts
 *
 * Navigation groups for the Suksai CRM sidebar.
 * Structure mirrors the approved concept (suksaidashboardconcept.html):
 *
 *   Estudio    → Dashboard, Agenda, Clientes, Rituales, Terapeutas
 *   Operaciones → Caja, Informes, Ajustes
 */

import type { ISidebarGroup } from '@infra/components/ui/common/Sidebar';
import { Icons } from '@infra/pages/DashboardPage/Dashboard.icons';

export const DASHBOARD_SIDEBAR_GROUPS: readonly ISidebarGroup[] = [
  {
    id: 'estudio',
    label: 'Estudio',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard/overview',
        icon: Icons.squaresFour,
      },
      {
        id: 'agenda',
        label: 'Agenda',
        href: '/dashboard/agenda',
        icon: Icons.calendarBlank,
      },
      {
        id: 'clientes',
        label: 'Clientes',
        href: '/dashboard/clientes',
        icon: Icons.usersThree,
      },
      {
        id: 'rituales',
        label: 'Masajes',
        href: '/dashboard/rituales',
        icon: Icons.flowerLotus,
      },
      {
        id: 'terapeutas',
        label: 'Terapeutas',
        href: '/dashboard/terapeutas',
        icon: Icons.handHeart,
      },
      {
        id: 'centros',
        label: 'Centros & Salas',
        href: '/dashboard/centros',
        icon: Icons.buildings,
      },
    ],
  },
];
