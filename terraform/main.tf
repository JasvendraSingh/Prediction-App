provider "null" {}

resource "null_resource" "bootstrap" {

    provisioner "local-exec" {
    command = <<EOT
      echo "Bootstrapping DevOps lab in Codespaces"
      ansible-playbook ../ansible/playbook.yml -i ../ansible/inventory.ini
    EOT
  }
}
