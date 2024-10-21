import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, AnimationController, Animation } from '@ionic/angular';
import * as QRCode from 'qrcode';
import { QrModalComponent } from '../qr-modal/qr-modal.component';

@Component({
  selector: 'app-profesor',
  templateUrl: 'profesor.page.html',
  styleUrls: ['profesor.page.scss'],
})
export class ProfesorPage implements OnInit {

  tema: string = 'Cambiar a Oscuro';
  qrCodeData?: string;
  animacionActiva: boolean = false;
  iconoNotificacion: string = 'mail-unread-outline';
  private animation: Animation | undefined;

  usuarioActual: any;

  constructor(
    private router: Router, 
    private modalController: ModalController, 
    private animCtrl: AnimationController,
  ) {}

  ngOnInit() {
    this.aplicarTema();
    this.animarNotificaciones();

    const usuario = localStorage.getItem('usuarioActual');
    if (usuario) {
      this.usuarioActual = JSON.parse(usuario);
    }
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

  async generarCodigoQR() {
    try {
      this.qrCodeData = await QRCode.toDataURL('https://steamuserimages-a.akamaihd.net/ugc/787497032232858295/A0BBC4BBF7966DB2C949BA726D85FAE24799418A/?imw=512&&ima=fit&impolicy=Letterbox&imcolor=%23000000&letterbox=false');
      const modal = await this.modalController.create({
        component: QrModalComponent,
        componentProps: { codigoQR: this.qrCodeData }
      });
      await modal.present();
    } catch (error) {
      console.error('Error al generar el código QR', error);
    }
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

  manejarClickNotificaciones() {
    this.detenerAnimacion();
  }
}
