import React from 'react';
import { Heart, Facebook, Instagram, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-foreground text-background py-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Logo and Description */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-9 h-9 bg-background rounded-full flex items-center justify-center">
                <Heart className="w-5 h-5 text-foreground" />
              </div>
              <h3 className="text-xl font-semibold">Paw Connect</h3>
            </div>
            <p className="text-background/70 mb-8 max-w-md leading-relaxed text-lg">
              Conectando tutores aos melhores cuidados veterinários. 
              Encontre profissionais qualificados próximos a você de forma simples e confiável.
            </p>
            <div className="flex space-x-4">
              <div className="w-12 h-12 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 smooth-transition cursor-pointer">
                <Facebook className="w-5 h-5" />
              </div>
              <div className="w-12 h-12 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 smooth-transition cursor-pointer">
                <Instagram className="w-5 h-5" />
              </div>
              <div className="w-12 h-12 bg-background/10 rounded-full flex items-center justify-center hover:bg-background/20 smooth-transition cursor-pointer">
                <Twitter className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Navegação</h4>
            <ul className="space-y-4 text-background/70">
              <li><a href="#" className="hover:text-background smooth-transition">Buscar Clínicas</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">Emergência 24h</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">Cadastrar Clínica</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">Contato</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-lg font-semibold mb-6">Suporte</h4>
            <ul className="space-y-4 text-background/70">
              <li><a href="#" className="hover:text-background smooth-transition">Central de Ajuda</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">Termos de Uso</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">Política de Privacidade</a></li>
              <li><a href="#" className="hover:text-background smooth-transition">FAQ</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-background/20 pt-8 text-center text-background/60">
          <p>&copy; 2024 Paw Connect. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
