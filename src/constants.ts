import React from 'react';
import { TicketStatus, UserRole } from './types';

export const ROLE_LABELS = {
  [UserRole.USER]: 'Empleado',
  [UserRole.TECHNICIAN]: 'Técnico',
  [UserRole.LEAD_TECHNICIAN]: 'Técnico Jefe',
  [UserRole.ADMIN]: 'Administrador'
};

export const TEAMS_THEME_COLOR = '#6264A7';

type IconProps = { size?: number; className?: string };

export const ICONS = {
  Ticket: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("path", {
    d: "M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"
  })),
  Chat: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("path", {
    d: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"
  })),
  MessageCircle: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("path", { key: "p1", d: "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" })
  ]),
  Sparkles: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("path", {
    d: "m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L12 3Z"
  })),
  Image: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("rect", { key: "rect", width: "18", height: "18", x: "3", y: "3", rx: "2", ry: "2" }),
    React.createElement("circle", { key: "circle", cx: "9", cy: "9", r: "2" }),
    React.createElement("path", { key: "path", d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" })
  ]),
  Spinner: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    className: `animate-spin ${className}`,
    width: size,
    height: size,
    xmlns: "http://www.w3.org/2000/svg",
    fill: "none",
    viewBox: "0 0 24 24"
  }, [
    React.createElement("circle", { key: "circle", className: "opacity-25", cx: "12", cy: "12", r: "10", stroke: "currentColor", strokeWidth: "4" }),
    React.createElement("path", { key: "path", className: "opacity-75", fill: "currentColor", d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" })
  ]),
  Check: ({ size = 16, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("polyline", { points: "20 6 9 17 4 12" })),
  Plus: ({ size = 16, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("line", { key: "line1", x1: "12", y1: "5", x2: "12", y2: "19" }),
    React.createElement("line", { key: "line2", x1: "5", y1: "12", x2: "19", y2: "12" })
  ]),
  Shield: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("path", {
    d: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
  })),
  User: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("path", { key: "path1", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" }),
    React.createElement("circle", { key: "circle", cx: "12", cy: "7", r: "4" })
  ]),
  Trash: ({ size = 16, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("polyline", { key: "p1", points: "3 6 5 6 21 6" }),
    React.createElement("path", { key: "p2", d: "M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" })
  ]),
  Logout: ({ size = 18, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("path", { key: "p1", d: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" }),
    React.createElement("polyline", { key: "p2", points: "16 17 21 12 16 7" }),
    React.createElement("line", { key: "p3", x1: "21", y1: "12", x2: "9", y2: "12" })
  ]),
  Bell: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("path", { key: "p1", d: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" }),
    React.createElement("path", { key: "p2", d: "M13.73 21a2 2 0 0 1-3.46 0" })
  ]),
  Close: ({ size = 16, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
     React.createElement("line", { key: "l1", x1: "18", y1: "6", x2: "6", y2: "18" }),
     React.createElement("line", { key: "l2", x1: "6", y1: "6", x2: "18", y2: "18" })
  ]),
  ArrowLeft: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("line", { key: "l1", x1: "19", y1: "12", x2: "5", y2: "12" }),
    React.createElement("polyline", { key: "p1", points: "12 19 5 12 12 5" })
  ]),
  LayoutGrid: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("rect", { key: "r1", x: "3", y: "3", width: "7", height: "7" }),
    React.createElement("rect", { key: "r2", x: "14", y: "3", width: "7", height: "7" }),
    React.createElement("rect", { key: "r3", x: "14", y: "14", width: "7", height: "7" }),
    React.createElement("rect", { key: "r4", x: "3", y: "14", width: "7", height: "7" })
  ]),
  List: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("line", { key: "l1", x1: "8", y1: "6", x2: "21", y2: "6" }),
    React.createElement("line", { key: "l2", x1: "8", y1: "12", x2: "21", y2: "12" }),
    React.createElement("line", { key: "l3", x1: "8", y1: "18", x2: "21", y2: "18" }),
    React.createElement("line", { key: "l4", x1: "3", y1: "6", x2: "3.01", y2: "6" }),
    React.createElement("line", { key: "l5", x1: "3", y1: "12", x2: "3.01", y2: "12" }),
    React.createElement("line", { key: "l6", x1: "3", y1: "18", x2: "3.01", y2: "18" })
  ]),
  Book: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("path", { key: "p1", d: "M4 19.5A2.5 2.5 0 0 1 6.5 17H20" }),
    React.createElement("path", { key: "p2", d: "M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" })
  ]),
  ChevronDown: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("polyline", { points: "6 9 12 15 18 9" })),
  ChevronUp: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("polyline", { points: "18 15 12 9 6 15" })),
  Filter: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("polygon", { points: "22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" })),
  Search: ({ size = 18, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("circle", { key: "c1", cx: "11", cy: "11", r: "8" }),
    React.createElement("line", { key: "l1", x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
  ]),
  Chart: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("line", { key: "l1", x1: "18", y1: "20", x2: "18", y2: "10" }),
    React.createElement("line", { key: "l2", x1: "12", y1: "20", x2: "12", y2: "4" }),
    React.createElement("line", { key: "l3", x1: "6", y1: "20", x2: "6", y2: "14" })
  ]),
  Clock: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("circle", { key: "c1", cx: "12", cy: "12", r: "10" }),
    React.createElement("polyline", { key: "p1", points: "12 6 12 12 16 14" })
  ]),
  Bolt: ({ size = 18, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("path", { d: "M13 2L3 14h9l-1 8 10-12h-9l1-8z" })),
  NetworkIntelligence: ({ size = 18, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("circle", { key: "c1", cx: "12", cy: "12", r: "3" }),
    React.createElement("line", { key: "l1", x1: "3", y1: "12", x2: "9", y2: "12" }),
    React.createElement("line", { key: "l2", x1: "15", y1: "12", x2: "21", y2: "12" }),
    React.createElement("line", { key: "l3", x1: "12", y1: "3", x2: "12", y2: "9" }),
    React.createElement("line", { key: "l4", x1: "12", y1: "15", x2: "12", y2: "21" })
  ]),
  Google: ({ size = 18, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("path", { key: "p1", d: "M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8z" }),
    React.createElement("path", { key: "p2", d: "M12 6v6l4 2" })
  ]),
  ArrowRight: ({ size = 14, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("path", { d: "M5 12h14m-7-7l7 7-7 7" })),
  ExternalLink: ({ size = 18, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("path", { key: "p1", d: "M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" }),
    React.createElement("polyline", { key: "pl1", points: "15 3 21 3 21 9" }),
    React.createElement("line", { key: "l1", x1: "10", y1: "14", x2: "21", y2: "3" })
  ]),
  Paperclip: ({ size = 18, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("path", { d: "m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.51a2 2 0 0 1-2.83-2.83l8.49-8.48" })),
  Send: ({ size = 18, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, React.createElement("path", { d: "M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" })),
  AlertTriangle: ({ size = 20, className = "" }: IconProps) => React.createElement("svg", {
    xmlns: "http://www.w3.org/2000/svg",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    className
  }, [
    React.createElement("path", { key: "p1", d: "m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" }),
    React.createElement("line", { key: "l1", x1: "12", y1: "9", x2: "12", y2: "13" }),
    React.createElement("line", { key: "l2", x1: "12", y1: "17", x2: "12.01", y2: "17" })
  ])
};