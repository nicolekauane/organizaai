-- Entrega 3 / etapa 4.1. MySQL >= 8.0.16, InnoDB.
-- Selecione explicitamente o banco de destino antes de executar.
-- Aplicar uma unica vez; nao usar no banco real sem backup e autorizacao.
CREATE TABLE vinculos_acompanhamento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    aluno_id INT NOT NULL,
    responsavel_id INT NOT NULL,
    status ENUM('pendente', 'autorizado', 'recusado', 'revogado') NOT NULL DEFAULT 'pendente',
    solicitado_em DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    autorizado_em DATETIME NULL,
    encerrado_em DATETIME NULL,
    CONSTRAINT uq_vinculo_par UNIQUE (aluno_id, responsavel_id),
    INDEX idx_vinculo_aluno_status (aluno_id, status),
    INDEX idx_vinculo_responsavel_status (responsavel_id, status),
    CONSTRAINT fk_vinculo_aluno FOREIGN KEY (aluno_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT fk_vinculo_responsavel FOREIGN KEY (responsavel_id) REFERENCES usuarios(id) ON DELETE RESTRICT ON UPDATE RESTRICT,
    CONSTRAINT ck_vinculo_distintos CHECK (aluno_id <> responsavel_id),
    CONSTRAINT ck_vinculo_status CHECK (status IN ('pendente', 'autorizado', 'recusado', 'revogado')),
    CONSTRAINT ck_vinculo_datas CHECK (
        (status = 'pendente' AND autorizado_em IS NULL AND encerrado_em IS NULL) OR
        (status = 'autorizado' AND autorizado_em IS NOT NULL AND encerrado_em IS NULL) OR
        (status = 'recusado' AND autorizado_em IS NULL AND encerrado_em IS NOT NULL) OR
        (status = 'revogado' AND autorizado_em IS NOT NULL AND encerrado_em IS NOT NULL)
    ),
    CONSTRAINT ck_vinculo_ordem CHECK (
        (autorizado_em IS NULL OR autorizado_em >= solicitado_em) AND
        (encerrado_em IS NULL OR encerrado_em >= solicitado_em) AND
        (autorizado_em IS NULL OR encerrado_em IS NULL OR encerrado_em >= autorizado_em)
    )
) ENGINE=InnoDB;

-- CHECK nao consulta outras tabelas: validar perfis nos dois tipos de escrita.
DELIMITER $$
CREATE TRIGGER vinculo_perfis_insert BEFORE INSERT ON vinculos_acompanhamento
FOR EACH ROW
BEGIN
    IF COALESCE((SELECT tipo_usuario FROM usuarios WHERE id = NEW.aluno_id), '') <> 'aluno'
       OR COALESCE((SELECT tipo_usuario FROM usuarios WHERE id = NEW.responsavel_id), '') <> 'responsavel' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vinculo exige aluno e responsavel existentes com os perfis corretos';
    END IF;
END$$
CREATE TRIGGER vinculo_perfis_update BEFORE UPDATE ON vinculos_acompanhamento
FOR EACH ROW
BEGIN
    IF COALESCE((SELECT tipo_usuario FROM usuarios WHERE id = NEW.aluno_id), '') <> 'aluno'
       OR COALESCE((SELECT tipo_usuario FROM usuarios WHERE id = NEW.responsavel_id), '') <> 'responsavel' THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Vinculo exige aluno e responsavel existentes com os perfis corretos';
    END IF;
END$$
-- Preservar os perfis de contas que ja participam de vinculos.
CREATE TRIGGER usuario_perfil_vinculado BEFORE UPDATE ON usuarios
FOR EACH ROW
BEGIN
    IF NEW.tipo_usuario <> OLD.tipo_usuario AND EXISTS (
        SELECT 1 FROM vinculos_acompanhamento WHERE aluno_id = OLD.id OR responsavel_id = OLD.id
    ) THEN
        SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Perfil de usuario vinculado nao pode ser alterado';
    END IF;
END$$
DELIMITER ;
