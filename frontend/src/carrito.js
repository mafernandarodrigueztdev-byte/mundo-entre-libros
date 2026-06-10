document.addEventListener('DOMContentLoaded', () => {
    const contenedorCarrito = document.querySelector('.contenedor-carrito-offcanvas');
    const elementoOffcanvas = document.getElementById('offcanvasCarrito');

    // Si NO están ambos elementos en esta página, detenemos el script pacíficamente
    if (!contenedorCarrito || !elementoOffcanvas) return; 

    const miOffcanvas = new bootstrap.Offcanvas(elementoOffcanvas, {
        backdrop: true,
        scroll: true
    });

    let tiempoEspera;

    contenedorCarrito.addEventListener('mouseenter', () => {
        clearTimeout(tiempoEspera);
        tiempoEspera = setTimeout(() => {
            miOffcanvas.show();
        }, 200); 
    });

    contenedorCarrito.addEventListener('mouseleave', () => {
        clearTimeout(tiempoEspera);
    });

    elementoOffcanvas.addEventListener('mouseleave', () => {
        miOffcanvas.hide();
    });
});