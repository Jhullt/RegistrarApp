import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { AnimationController, Animation, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  tema: string = 'Cambiar a Oscuro';
  animacionActiva: boolean = false;
  iconoNotificacion: string = 'mail-unread-outline';
  private animation: Animation | undefined;
  isSupported = false;
  usuarioActual: any;

  historialAsistencia: { fecha: string; asignatura: string; seccion: string }[] = [];

  constructor(private router: Router, private animCtrl: AnimationController, private toast: ToastController) {}

  ngOnInit() {
    this.aplicarTema();
    this.animarNotificaciones();
    BarcodeScanner.isSupported().then((result) => {
      this.isSupported = result.supported;
    });

    const usuario = localStorage.getItem('usuarioActual');
    if (usuario) {
      this.usuarioActual = JSON.parse(usuario);
    }

    this.cargarHistorialAsistencia();
  }

  cargarHistorialAsistencia() {
    this.historialAsistencia = JSON.parse(localStorage.getItem('historialAsistencia') || '[]');
  }

  handleScanResult(content: string) {
    this.showToast(`Código QR escaneado: ${content}`);
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (e) {
      const [asignatura, seccion] = content.split(':');

      if (asignatura && seccion) {
        this.agregarAsistencia(asignatura.trim(), seccion.trim());
      } else {
        this.showToast("El formato del código QR no es válido.");
      }
      return;
    }

    if (parsedContent.clase && parsedContent.seccion) {
      this.agregarAsistencia(parsedContent.clase, parsedContent.seccion);
    } else {
      this.showToast("El contenido del QR no tiene la estructura esperada.");
    }
  }

  agregarAsistencia(asignatura: string, seccion: string) {
    const asistencia = {
      fecha: new Date().toLocaleDateString(),
      asignatura: asignatura,
      seccion: seccion,
    };

    const historial = JSON.parse(localStorage.getItem('historialAsistencia') || '[]');
    historial.push(asistencia);
    localStorage.setItem('historialAsistencia', JSON.stringify(historial));
    this.cargarHistorialAsistencia();
  }

  async scan() {
    const data = await CapacitorBarcodeScanner.scanBarcode({
      hint: CapacitorBarcodeScannerTypeHint.ALL,
    });
    this.handleScanResult(data.ScanResult);
  }

  animarNotificaciones() {
    if (this.animacionActiva) return;

    const icon = document.querySelector('.icono-notificacion')!;
    this.animation = this.animCtrl.create()
      .addElement(icon)
      .duration(500)
      .iterations(Infinity)
      .fromTo('transform', 'scale(1)', 'scale(1.2)')
      .fromTo('transform', 'scale(1.2)', 'scale(1)');

    this.animation.play();
    this.animacionActiva = true;
  }

  detenerAnimacion() {
    if (this.animation) {
      this.animation.stop();
      this.animacionActiva = false;
      this.iconoNotificacion = 'mail-outline';

      setTimeout(() => {
        this.iconoNotificacion = 'mail-unread-outline';
        this.animarNotificaciones();
      }, 3000);
    }
  }

  async showToast(texto: string) {
    const toast = await this.toast.create({
      message: texto,
      duration: 3000,
      positionAnchor: 'footer2',
      cssClass: 'rounded-toast',
    });
    await toast.present();
  }

  aplicarTema() {
    const savedTema = localStorage.getItem('tema');
    if (savedTema === 'oscuro') {
      document.documentElement.style.setProperty("--cf-fondo", "#002020");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#0F4242");
      this.tema = 'Cambiar a Claro';
    } else {
      document.documentElement.style.setProperty("--cf-fondo", "#89B8B8");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#BEDBDB");
      this.tema = 'Cambiar a Oscuro';
    }
  }

  cambiarTema() {
    if (this.tema === 'Cambiar a Oscuro') {
      document.documentElement.style.setProperty("--cf-fondo", "#002020");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#0F4242");
      localStorage.setItem('tema', 'oscuro');
      this.tema = 'Cambiar a Claro';
    } else {
      document.documentElement.style.setProperty("--cf-fondo", "#89B8B8");
      document.documentElement.style.setProperty("--cf-sub-fondo", "#BEDBDB");
      localStorage.setItem('tema', 'claro');
      this.tema = 'Cambiar a Oscuro';
    }
  }

  salir() {
    this.router.navigate(['/login']);
  }

  manejarClickNotificaciones() {
    this.detenerAnimacion();
  }
}
