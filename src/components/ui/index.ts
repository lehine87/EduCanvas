// =============================================================================
// UI COMPONENTS INDEX
// =============================================================================
// 이 파일은 모든 UI 컴포넌트의 중앙 export 허브입니다.

// =============================================================================
// EXISTING CUSTOM COMPONENTS (정리 후 추가할 예정)
// =============================================================================

// Loading Components
export { Loading } from './Loading';

// Modal Components  
export { Modal } from './Modal';

// Student Components
export { StudentCard } from './StudentCard';
export { VirtualizedStudentList } from './VirtualizedStudentList';

// Other Custom Components
export { EnhancedSearchBox } from './EnhancedSearchBox';
export { DropZone } from './DropZone';
export { SkipLinks } from './SkipLinks';
// FocusManager component temporarily disabled due to export issues
// export { FocusManager } from './FocusManager';

// ClassFlow Components
export { ClassContainer } from './classflow/ClassContainer';
export { DragHandle } from './classflow/DragHandle';
export { LoadingPlaceholder } from './classflow/LoadingPlaceholder';

// =============================================================================
// SHADCN/UI COMPONENTS (설치 완료)  
// =============================================================================
// NOTE: 기존 커스텀 컴포넌트와 중복되지 않는 새로운 컴포넌트만 export

// Form Components (새로운)
export { Button, buttonVariants } from './button';
export { Input } from './input';
export { Label } from './label';
export { Textarea } from './textarea';
export { Checkbox } from './checkbox';
export { RadioGroup, RadioGroupItem } from './radio-group';
export { Switch } from './switch';
export { Slider } from './slider';

// Layout Components (새로운)
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
export { Separator } from './separator';
export { AspectRatio } from './aspect-ratio';
export { ScrollArea, ScrollBar } from './scroll-area';

// Navigation Components (새로운)
export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue } from './select';
export { Tabs, TabsContent, TabsList, TabsTrigger } from './tabs';
export { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle } from './navigation-menu';
export { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from './breadcrumb';
export { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from './pagination';

// Feedback Components
export { Alert, AlertDescription, AlertTitle } from './alert';
export { Badge, badgeVariants } from './badge';
export { Progress } from './progress';
export { Skeleton } from './skeleton';
// Sonner component temporarily disabled due to export issues
// export { Sonner } from './sonner';

// Overlay Components
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
export { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from './alert-dialog';
export { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from './sheet';
export { Popover, PopoverContent, PopoverTrigger } from './popover';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
export { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

// Menu Components
export { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuPortal, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuSub, DropdownMenuSubContent, DropdownMenuSubTrigger, DropdownMenuTrigger } from './dropdown-menu';
export { ContextMenu, ContextMenuCheckboxItem, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuLabel, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut, ContextMenuSub, ContextMenuSubContent, ContextMenuSubTrigger, ContextMenuTrigger } from './context-menu';
export { Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarMenu, MenubarRadioGroup, MenubarRadioItem, MenubarSeparator, MenubarShortcut, MenubarSub, MenubarSubContent, MenubarSubTrigger, MenubarTrigger } from './menubar';

// Display Components
export { Avatar, AvatarFallback, AvatarImage } from './avatar';
export { Calendar } from './calendar';
export { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from './carousel';
// Chart components temporarily disabled due to export issues
// export { Chart, ChartConfig, ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from './chart';
export { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from './table';

// Interaction Components
export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from './command';
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from './collapsible';
export { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './accordion';
export { Toggle, toggleVariants } from './toggle';
export { ToggleGroup, ToggleGroupItem } from './toggle-group';
export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerOverlay, DrawerPortal, DrawerTitle, DrawerTrigger } from './drawer';

// Layout & Sizing
// Resizable components temporarily disabled due to export issues
// export { Resizable, ResizableHandle, ResizablePanel, ResizablePanelGroup } from './resizable';
export { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupAction, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuAction, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarMenuSkeleton, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, SidebarProvider, SidebarRail, SidebarSeparator, SidebarTrigger, useSidebar } from './sidebar';

// Forms  
export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField } from './form';
export { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from './input-otp';