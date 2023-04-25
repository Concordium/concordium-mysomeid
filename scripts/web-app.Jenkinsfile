@Library('concordium-pipelines') _
pipeline {
    agent any
    environment {
        ecr_repo_domain = '192549843005.dkr.ecr.eu-west-1.amazonaws.com'
    }
    stages {
        stage('ecr-login') {
            steps {
                ecrLogin(env.ecr_repo_domain, 'eu-west-1')
            }
        }
        stage('build') {
            environment {
                image_repo = "${ecr_repo_domain}/concordium/mysomeid-dapp"
                image_name = "${image_repo}:${image_tag}"

                REACT_APP_SERVICE_BASE = "https://api.testnet.mysome.id/v1"
                REACT_APP_CONTRACT_INDEX = "4321"
                REACT_APP_BASE_URL = "https://app.testnet.mysome.id"
                REACT_APP_CCD_SCAN_BASE_URL = "https://testnet.ccdscan.io/"
            }
            steps {
                dir('packages/web-app') {
                    sh '''\
                        docker build \
                            -f Dockerfile \
                            -t "${image_name}" \
                            --no-cache \
                            .
                        docker push "${image_name}"
                    '''.stripIndent()
                }
            }
        }
    }
}
