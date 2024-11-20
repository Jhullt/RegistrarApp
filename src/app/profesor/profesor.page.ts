import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ModalController, AnimationController, Animation, AlertController } from '@ionic/angular';
import * as QRCode from 'qrcode';
import { QrModalComponent } from '../qr-modal/qr-modal.component';

interface Clases {
  [key: string]: {
    [key: string]: string[];  // Día(s) asignado(s) a cada clase
  };
}

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

  selectedDay: string = '';
  selectedClass: string = '';
  selectedSection: string = '';  // Variable para almacenar la sección seleccionada
  availableClasses: string[] = [];
  availableSections: string[] = [];
  isClassSelectDisabled: boolean = true;
  isSectionSelectDisabled: boolean = true;  // Agregado para deshabilitar la sección
  noClassesMessage: string = '';  // Mensaje que se mostrará si no hay clases para el día seleccionado

  clases: Clases = {
    Programación: {
      "003": ['Lunes', 'Martes'],
      "004": ['Lunes', 'Viernes'],
      "005": ['Martes', 'Miercoles'],
    },
    Arquitectura: {
      "009": ['Lunes'],
      "001": ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'],
    },
    Matemáticas: {
      "001": ['Jueves'],
      "003": ['Lunes'],
      "004": ['Martes'],
    },
  };

  constructor(
    private router: Router,
    private modalController: ModalController,
    private animCtrl: AnimationController,
    private alertController: AlertController,
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
    if (!this.selectedClass || !this.selectedDay || !this.selectedSection) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'Por favor, selecciona un día, una clase y una sección válidos antes de generar el código QR.',
        buttons: ['Aceptar']
      });
      await alert.present();
      return;
    }

    const codigoQRData = {
      clase: this.selectedClass,
      dia: this.selectedDay,
      seccion: this.selectedSection  // Ahora se utilizará la sección seleccionada correctamente
    };

    try {
      const qrDataString = JSON.stringify(codigoQRData);
      this.qrCodeData = await QRCode.toDataURL(qrDataString);
      
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
    }
  }

  manejarClickNotificaciones() {
    this.iconoNotificacion = 'mail-outline';
    this.detenerAnimacion();
  }

  async onDaySelect(event: any) {
    this.selectedDay = event.detail.value;
    this.updateAvailableClasses();
    this.selectedClass = '';  // Reinicia la clase seleccionada
    this.selectedSection = '';  // Reinicia la sección seleccionada
    this.isSectionSelectDisabled = true;  // Deshabilita la selección de sección

    // Si no hay clases para el día seleccionado, mostramos el modal
    if (this.noClassesMessage) {
      const alert = await this.alertController.create({
        header: 'Aviso',
        message: this.noClassesMessage,
        buttons: ['Aceptar']
      });
      await alert.present();
    }
  }

  updateAvailableClasses() {
    this.availableClasses = [];
    this.noClassesMessage = '';  // Resetea el mensaje de "no hay clases"

    for (const clase in this.clases) {
      for (const seccion in this.clases[clase]) {
        // Verifica si el día seleccionado está incluido en el horario de la clase
        if (this.clases[clase][seccion].includes(this.selectedDay)) {
          this.availableClasses.push(clase);
          break;
        }
      }
    }

    if (this.availableClasses.length === 0) {
      this.noClassesMessage = 'Este día no tienes clases';
      this.selectedClass = '';  // Limpiar la clase seleccionada si no hay clases
      this.selectedSection = '';  // Limpiar la sección seleccionada si no hay clases
      this.isClassSelectDisabled = true;  // Deshabilitar la selección de clase
      this.isSectionSelectDisabled = true;  // Deshabilitar la selección de sección
    } else {
      this.isClassSelectDisabled = false;  // Habilitar la selección de clase
    }
  }

  async onClassSelect(event: any) {
    this.selectedClass = event.detail.value;
    this.updateAvailableSections();
    this.selectedSection = '';  // Reinicia la sección seleccionada
    this.isSectionSelectDisabled = false;  // Habilita la selección de sección
  }

  updateAvailableSections() {
    if (this.selectedClass && this.clases[this.selectedClass]) {
      // Filtra las secciones solo si el día seleccionado está asignado a la clase
      this.availableSections = Object.keys(this.clases[this.selectedClass]).filter(section => 
        this.clases[this.selectedClass][section].includes(this.selectedDay)
      );
    } else {
      this.availableSections = [];
    }

    // Si no hay secciones disponibles para el día seleccionado, deshabilita la selección de sección
    if (this.availableSections.length === 0) {
      this.selectedSection = '';  // Limpia la sección seleccionada
      this.isSectionSelectDisabled = true;  // Deshabilita la selección de sección
    }
  }
}
