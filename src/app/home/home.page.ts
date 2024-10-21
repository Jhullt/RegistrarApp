import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { BarcodeScanner } from '@capacitor-mlkit/barcode-scanning';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerScanOrientation, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
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
  
  constructor(private router: Router, private animCtrl: AnimationController, private toast: ToastController) {}
  
  ngOnInit() {
    this.aplicarTema();
    this.animarNotificaciones();
    BarcodeScanner.isSupported().then((result) =>{
      this.isSupported = result.supported
    })

    const usuario = localStorage.getItem('usuarioActual');
    if (usuario) {
      this.usuarioActual = JSON.parse(usuario);
    }
  }

  async scan(){
    CapacitorBarcodeScanner.scanBarcode(
      {hint: CapacitorBarcodeScannerTypeHint.ALL}
    ).then((data)=>{
      this.showToast(data.ScanResult)
    })
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

  async requestPermissions(): Promise<boolean> {
    const { camera } = await BarcodeScanner.requestPermissions();
    return camera === 'granted' || camera === 'limited';
  }

  async showToast(texto:string) {
    const toast = await this.toast.create({
      message: texto,
      duration: 3000,
      positionAnchor: 'footer2',
      cssClass: 'rounded-toast'
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
