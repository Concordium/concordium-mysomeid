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
                image_name = "${image_repo}:${environment}-${image_tag}"
            }
            steps {
                dir('packages/web-app') {
                    sh '''\
                        docker build \
                            -f Dockerfile \
                            -t "${image_name}" \
                            --build-arg environment \
                            --no-cache \
                            .
                        docker push "${image_name}"
                    '''.stripIndent()
                }
            }
        }
    }
}
