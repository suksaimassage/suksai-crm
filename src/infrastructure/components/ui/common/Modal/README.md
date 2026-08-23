# 🪟 Modal Component

Componente de modal accesible y responsive construido con **Clean Code** y
**Principios SOLID**.

## 🎯 Características

- ✅ **Composable**: Usa Card internamente (Header, Body, Footer)
- ✅ **6 Tamaños**: xs, sm, md, lg, xl, full
- ✅ **3 Posiciones**: center, top, bottom
- ✅ **Control de Cierre**: backdrop click, escape key
- ✅ **Accesible**: Focus trap, ARIA, keyboard navigation
- ✅ **Dialog Incluido**: Confirmaciones con tipos (info, success, warning,
  error, confirm)
- ✅ **Animaciones**: Fade, slide, scale
- ✅ **Portal**: Renderiza fuera del DOM tree
- ✅ **Lock Scroll**: Bloquea scroll del body
- ✅ **Mobile First**: Full screen en mobile para tamaños grandes
- ✅ **Type-safe**: TypeScript 100%
- ✅ **Hook incluido**: useModal() para manejo fácil

---

## 📚 API

### **Modal Props**

```typescript
interface ModalProps {
  open: boolean;
  onClose: (reason: ModalCloseReason) => void;
  children: ReactNode;

  // Apariencia
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  position?: 'center' | 'top' | 'bottom';

  // Comportamiento
  closeOnBackdropClick?: boolean; // default: true
  closeOnEscape?: boolean; // default: true
  showCloseButton?: boolean; // default: true
  lockScroll?: boolean; // default: true

  // Visual
  animated?: boolean; // default: true
  backdropBlur?: boolean; // default: false

  // Callbacks
  onAfterOpen?: () => void;
  onAfterClose?: () => void;
}
```

---

## 🚀 Uso Básico

### **Modal Simple**

```tsx
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  useModal,
} from '@components/ui/Modal';

function MyComponent() {
  const { isOpen, open, close } = useModal();

  return (
    <>
      <button onClick={open}>Open Modal</button>

      <Modal open={isOpen} onClose={close}>
        <ModalHeader title="Modal Title" onClose={close} />
        <ModalBody>
          <p>Modal content here</p>
        </ModalBody>
        <ModalFooter>
          <button onClick={close}>Close</button>
        </ModalFooter>
      </Modal>
    </>
  );
}
```

---

### **Con Control de Cierre**

```tsx
<Modal
  open={isOpen}
  onClose={(reason) => {
    console.log('Closed by:', reason);
    // reason puede ser: 'backdrop' | 'escape' | 'close-button' | 'action'
    close();
  }}
  closeOnBackdropClick={false} // NO cerrar al hacer click fuera
  closeOnEscape={true} // SÍ cerrar con Escape
>
  {/* ... */}
</Modal>
```

---

## 📏 Tamaños

```tsx
<Modal size="xs">      // 400px max
<Modal size="sm">      // 500px max
<Modal size="md">      // 600px max (default)
<Modal size="lg">      // 800px max
<Modal size="xl">      // 1000px max
<Modal size="full">    // 100% width
```

**Mobile:**

- Tamaños lg, xl, full → Full screen en mobile
- Tamaños xs, sm, md → 90% width en mobile

---

## 📍 Posiciones

```tsx
<Modal position="center">  // Centrado (default)
<Modal position="top">     // Top de la pantalla
<Modal position="bottom">  // Bottom de la pantalla
```

---

## 🎭 ModalHeader

```tsx
interface ModalHeaderProps {
  children?: ReactNode;
  title?: string;
  subtitle?: string;
  showCloseButton?: boolean;
  onClose?: () => void;
}
```

### **Con Título**

```tsx
<ModalHeader
  title="Modal Title"
  subtitle="Optional subtitle"
  onClose={handleClose}
/>
```

### **Personalizado**

```tsx
<ModalHeader onClose={handleClose}>
  <CustomHeader />
</ModalHeader>
```

### **Sin Botón de Cerrar**

```tsx
<ModalHeader title="No close button" showCloseButton={false} />
```

---

## 📄 ModalBody

```typescript
interface ModalBodyProps {
  children: ReactNode;
  padding?: 'none' | 'sm' | 'md' | 'lg'; // default: 'md'
  scrollable?: boolean; // default: false
}
```

### **Normal**

```tsx
<ModalBody>
  <p>Content here</p>
</ModalBody>
```

### **Sin Padding (para imágenes)**

```tsx
<ModalBody padding="none">
  <img src="..." style={{ width: '100%' }} />
</ModalBody>
```

### **Scrollable**

```tsx
<ModalBody scrollable>
  <LongContent />
</ModalBody>
// → Max height 60vh con scroll interno
```

---

## 🦶 ModalFooter

```typescript
interface ModalFooterProps {
  children: ReactNode;
  align?: 'left' | 'center' | 'right' | 'between'; // default: 'right'
}
```

### **Alineación**

```tsx
<ModalFooter align="right">
  <button>Cancel</button>
  <button>Confirm</button>
</ModalFooter>

<ModalFooter align="between">
  <button>Delete</button>
  <button>Save</button>
</ModalFooter>
```

---

## 💬 Dialog Component

Componente especializado para confirmaciones.

```typescript
interface DialogProps {
  open: boolean;
  onClose: (reason: ModalCloseReason) => void;

  // Contenido
  title: string;
  message: string | ReactNode;
  type?: 'info' | 'success' | 'warning' | 'error' | 'confirm';

  // Botones
  confirmText?: string; // default: 'Confirm'
  cancelText?: string; // default: 'Cancel'
  showCancel?: boolean; // default: true

  // Callbacks
  onConfirm?: () => void;
  onCancel?: () => void;

  // Estados
  loading?: boolean;
  autoButtonColor?: boolean; // Color del botón según tipo
}
```

### **Dialog de Confirmación**

```tsx
<Dialog
  open={isOpen}
  onClose={handleClose}
  type="confirm"
  title="Delete Item"
  message="Are you sure you want to delete this item? This action cannot be undone."
  confirmText="Delete"
  cancelText="Cancel"
  onConfirm={handleDelete}
  onCancel={handleClose}
/>
```

### **Dialog de Error**

```tsx
<Dialog
  open={isOpen}
  onClose={handleClose}
  type="error"
  title="Error"
  message="Something went wrong. Please try again."
  showCancel={false}
  confirmText="OK"
  onConfirm={handleClose}
/>
```

### **Dialog con Loading**

```tsx
<Dialog
  open={isOpen}
  onClose={handleClose}
  type="warning"
  title="Delete Account"
  message="This will permanently delete your account and all data."
  confirmText="Delete Account"
  loading={isDeleting}
  onConfirm={async () => {
    setIsDeleting(true);
    await deleteAccount();
    setIsDeleting(false);
    handleClose();
  }}
/>
```

### **Tipos de Dialog**

```tsx
type = 'info'; // 💙 Azul - Información
type = 'success'; // 💚 Verde - Éxito
type = 'warning'; // 🟡 Amarillo - Advertencia
type = 'error'; // 🔴 Rojo - Error
type = 'confirm'; // 💜 Morado - Confirmación (default)
```

---

## 🪝 useModal Hook

Hook para manejar el estado del modal fácilmente.

```tsx
const { isOpen, open, close, toggle } = useModal(initialState?);
```

### **Uso**

```tsx
function MyComponent() {
  const modal = useModal(); // false por defecto

  return (
    <>
      <button onClick={modal.open}>Open</button>
      <button onClick={modal.toggle}>Toggle</button>

      <Modal open={modal.isOpen} onClose={modal.close}>
        {/* ... */}
      </Modal>
    </>
  );
}
```

---

## 🎯 Casos de Uso

### **Formulario**

```tsx
function EditUserModal({ user, open, onClose }) {
  const handleSubmit = () => {
    // Save user
    onClose('action');
  };

  return (
    <Modal open={open} onClose={onClose}>
      <ModalHeader title="Edit User" onClose={onClose} />
      <ModalBody>
        <form>
          <input name="name" defaultValue={user.name} />
          <input name="email" defaultValue={user.email} />
        </form>
      </ModalBody>
      <ModalFooter>
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSubmit}>Save</button>
      </ModalFooter>
    </Modal>
  );
}
```

---

### **Confirmación de Eliminación**

```tsx
function DeleteConfirmDialog({ item, open, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    await deleteItem(item.id);
    setLoading(false);
    onConfirm();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      type="error"
      title="Delete Item"
      message={`Are you sure you want to delete "${item.name}"?`}
      confirmText="Delete"
      loading={loading}
      onConfirm={handleDelete}
    />
  );
}
```

---

### **Modal con Imagen**

```tsx
<Modal open={isOpen} onClose={handleClose} size="lg">
  <ModalHeader title="Preview" onClose={handleClose} />
  <ModalBody padding="none">
    <img src="/image.jpg" style={{ width: '100%', display: 'block' }} />
  </ModalBody>
  <ModalFooter>
    <button onClick={handleClose}>Close</button>
  </ModalFooter>
</Modal>
```

---

### **Modal con Scroll Interno**

```tsx
<Modal open={isOpen} onClose={handleClose}>
  <ModalHeader title="Terms of Service" />
  <ModalBody scrollable>
    <LongTermsContent />
  </ModalBody>
  <ModalFooter>
    <button onClick={handleClose}>Accept</button>
  </ModalFooter>
</Modal>
```

---

### **Modal que NO Cierra con Backdrop**

```tsx
<Modal
  open={isOpen}
  onClose={handleClose}
  closeOnBackdropClick={false} // Importante!
  closeOnEscape={false} // También deshabilitar escape
>
  <ModalHeader
    title="Loading..."
    showCloseButton={false} // Sin botón de cerrar
  />
  <ModalBody>
    <Spinner />
    <p>Please wait...</p>
  </ModalBody>
</Modal>
```

---

## ♿ Accesibilidad

### **ARIA Attributes Automáticos**

```tsx
<Modal open={isOpen}>
→ role="dialog"
→ aria-modal="true"
→ aria-labelledby="modal-title"
```

### **Focus Trap**

- Focus automático en primer elemento focuseable
- Tab loop dentro del modal
- Restaura focus al cerrar

### **Keyboard Navigation**

- `Escape`: Cerrar (si `closeOnEscape={true}`)
- `Tab`: Navegar entre elementos
- `Shift + Tab`: Navegar hacia atrás

### **Lock Scroll**

- Bloquea scroll del body automáticamente
- Previene layout shift con padding

---

## 🎨 Customización

### **Custom Animations**

```tsx
<Modal animated={true}>  // Fade + scale/slide
<Modal animated={false}> // Sin animación
```

### **Backdrop Blur**

```tsx
<Modal backdropBlur={true}>
// Aplica blur(4px) al fondo
```

### **Callbacks**

```tsx
<Modal
  onAfterOpen={() => console.log('Opened')}
  onAfterClose={() => console.log('Closed')}
>
```

---

## 📱 Mobile First

### **Responsive Behavior**

**Mobile (<768px):**

- Tamaños lg, xl, full → 100% width, 100% height
- Sin border radius
- Full screen experience

**Desktop (≥768px):**

- Tamaños según configuración
- Border radius
- Centered o positioned

---

## 🏗️ Arquitectura SOLID

### **Single Responsibility**

- `Modal`: Maneja modal container y overlay
- `ModalHeader`: Solo header
- `ModalBody`: Solo contenido
- `ModalFooter`: Solo footer
- `Dialog`: Solo confirmaciones

### **Open/Closed**

- Extensible via props
- Composable con subcomponentes

### **Composition**

- Usa Card internamente
- Subcomponentes componibles

---

**Componente Modal creado con ❤️ siguiendo Clean Code y SOLID**
