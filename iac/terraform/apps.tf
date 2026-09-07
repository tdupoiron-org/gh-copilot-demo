############################################
## DATABASE                               ##
############################################

variable "resource_group_name" {
  description = "Name of the resource group that hosts the application infrastructure."
  type        = string
}

variable "location" {
  description = "Azure region for the application infrastructure."
  type        = string
}

variable "container_registry_name" {
  description = "Globally unique name for the Azure Container Registry."
  type        = string
}

variable "openai_account_name" {
  description = "Globally unique name for the Azure OpenAI account."
  type        = string
}

############################################
## PLATFORM SERVICES                      ##
############################################

resource "azurerm_container_registry" "container_registry" {
  name                = var.container_registry_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku                 = "Basic"
  admin_enabled       = false
}

resource "azurerm_cognitive_account" "openai" {
  name                  = var.openai_account_name
  resource_group_name   = var.resource_group_name
  location              = var.location
  kind                  = "OpenAI"
  sku_name              = "S0"
  custom_subdomain_name = var.openai_account_name

  public_network_access_enabled = true
}

############################################
## DATABASE                               ##
############################################

resource "null_resource" "db_schema" {
  depends_on = [
    azurerm_mssql_database.mssql_database
  ]
  provisioner "local-exec" {
    command = "sqlcmd -U ${local.mssql_server_administrator_login} -P ${local.mssql_server_administrator_login_password} -S ${azurerm_mssql_server.mssql_server.fully_qualified_domain_name} -d ${local.mssql_database_name} -i ../../support/datainit/MYDrivingDB.sql -e"
  }
}

resource "null_resource" "db_datainit" {
  depends_on = [
    null_resource.db_schema
  ]
  provisioner "local-exec" {
    command = "cd ../../support/datainit; bash ./sql_data_init.sh -s ${azurerm_mssql_server.mssql_server.fully_qualified_domain_name} -u ${local.mssql_server_administrator_login} -p ${local.mssql_server_administrator_login_password} -d ${local.mssql_database_name}; cd ../../iac/terraform"
  }
}

############################################
## DOCKER                                 ##
############################################

resource "null_resource" "docker_simulator" {
  depends_on = [
    azurerm_container_registry.container_registry
  ]
  provisioner "local-exec" {
    command = "az acr build --image devopsoh/simulator:latest --registry ${azurerm_container_registry.container_registry.login_server} --file ../../support/simulator/Dockerfile ../../support/simulator"
  }
}

resource "null_resource" "docker_tripviewer" {
  provisioner "local-exec" {
    command = "az acr build --image devopsoh/tripviewer:latest --registry ${azurerm_container_registry.container_registry.login_server} --file ../../support/tripviewer/Dockerfile ../../support/tripviewer"
  }
}

resource "null_resource" "docker_api-poi" {
  provisioner "local-exec" {
    command = "az acr build --image devopsoh/api-poi:${local.apipoi_base_image_tag} --registry ${azurerm_container_registry.container_registry.login_server} --build-arg build_version=${local.apipoi_base_image_tag} --file ../../apis/poi/web/Dockerfile ../../apis/poi/web"
  }
}

resource "null_resource" "docker_api-trips" {
  provisioner "local-exec" {
    command = "az acr build --image devopsoh/api-trips:${local.apitrips_base_image_tag} --registry ${azurerm_container_registry.container_registry.login_server} --build-arg build_version=${local.apitrips_base_image_tag} --file ../../apis/trips/Dockerfile ../../apis/trips"
  }
}

resource "null_resource" "docker_api-user-java" {
  provisioner "local-exec" {
    command = "az acr build --image devopsoh/api-user-java:${local.apiuserjava_base_image_tag} --registry ${azurerm_container_registry.container_registry.login_server} --build-arg build_version=${local.apiuserjava_base_image_tag} --file ../../apis/user-java/Dockerfile ../../apis/user-java"
  }
}

resource "null_resource" "docker_api-userprofile" {
  provisioner "local-exec" {
    command = "az acr build --image devopsoh/api-userprofile:${local.apiuserprofile_base_image_tag} --registry ${azurerm_container_registry.container_registry.login_server} --build-arg build_version=${local.apiuserprofile_base_image_tag} --file ../../apis/userprofile/Dockerfile ../../apis/userprofile"
  }
}
