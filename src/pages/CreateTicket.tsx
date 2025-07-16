
import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const CreateTicket = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [selectedService, setSelectedService] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  // Mock data da clínica
  const clinic = {
    name: "Clínica Veterinária Pet Care",
    services: ["Clínica Geral", "Cirurgia", "Dermatologia", "Radiologia", "Cardiologia"]
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] || null;
    setFile(selectedFile);
  };

  const removeFile = () => {
    setFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService || !title || !description) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (selectedService !== "Clínica Geral" && !file) {
      toast({
        title: "Erro", 
        description: "Para serviços especializados é necessário anexar o encaminhamento do clínico geral.",
        variant: "destructive",
      });
      return;
    }

    // Aqui seria feita a requisição para a API
    toast({
      title: "Chamado criado com sucesso!",
      description: "Sua solicitação foi enviada para a clínica veterinária.",
    });

    navigate(`/clinic/${id}`);
  };

  const needsReferral = selectedService && selectedService !== "Clínica Geral";

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="mb-6 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>

            <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40">
              <h1 className="text-3xl font-semibold text-foreground mb-2">
                Abrir Chamado
              </h1>
              <p className="text-muted-foreground">
                Solicite atendimento para {clinic.name}
              </p>
            </div>
          </div>

          {/* Formulário */}
          <div className="bg-card rounded-3xl p-8 apple-shadow border border-border/40">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Atendimento */}
              <div>
                <Label htmlFor="service" className="text-base font-medium text-foreground mb-3 block">
                  Tipo de Atendimento *
                </Label>
                <Select value={selectedService} onValueChange={setSelectedService}>
                  <SelectTrigger className="h-12 rounded-xl border-border/50">
                    <SelectValue placeholder="Selecione o tipo de atendimento" />
                  </SelectTrigger>
                  <SelectContent>
                    {clinic.services.map((service, index) => (
                      <SelectItem key={index} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Formulário aparece só após seleção do serviço */}
              {selectedService && (
                <>
                  {/* Título */}
                  <div>
                    <Label htmlFor="title" className="text-base font-medium text-foreground mb-3 block">
                      Título do Caso *
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Escreva aqui um título para o problema"
                      className="h-12 rounded-xl border-border/50"
                    />
                  </div>

                  {/* Descrição */}
                  <div>
                    <Label htmlFor="description" className="text-base font-medium text-foreground mb-3 block">
                      Descrição *
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Descreva detalhadamente o que o animal está sentindo, sintomas observados, há quanto tempo começou, etc."
                      rows={6}
                      className="rounded-xl border-border/50 resize-none"
                    />
                  </div>

                  {/* Upload de arquivo para serviços especializados */}
                  {needsReferral && (
                    <div>
                      <Label className="text-base font-medium text-foreground mb-3 block">
                        Encaminhamento do Clínico Geral *
                      </Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Para atendimentos especializados é necessário anexar o documento de encaminhamento do clínico geral.
                      </p>
                      
                      <div className="border-2 border-dashed border-border/50 rounded-xl p-6">
                        {!file ? (
                          <div className="text-center">
                            <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                            <p className="text-muted-foreground mb-4">
                              Clique para selecionar ou arraste o arquivo aqui
                            </p>
                            <input
                              type="file"
                              onChange={handleFileChange}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              className="hidden"
                              id="file-upload"
                            />
                            <Label
                              htmlFor="file-upload"
                              className="inline-flex items-center justify-center px-6 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 cursor-pointer smooth-transition"
                            >
                              Selecionar Arquivo
                            </Label>
                            <p className="text-xs text-muted-foreground mt-2">
                              Formatos aceitos: PDF, JPG, PNG, DOC, DOCX (máx. 10MB)
                            </p>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between bg-muted/50 rounded-xl p-4">
                            <div>
                              <p className="font-medium text-foreground">{file.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={removeFile}
                              className="text-red-500 hover:text-red-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botões */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => navigate(-1)}
                      className="flex-1 h-12 rounded-xl border-border/50"
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 h-12 bg-primary text-white hover:bg-primary/90 rounded-xl"
                    >
                      Enviar Chamado
                    </Button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default CreateTicket;
