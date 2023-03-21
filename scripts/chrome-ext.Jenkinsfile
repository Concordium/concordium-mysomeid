@Library('concordium-pipelines') _
pipeline {
    agent any
    environment {
        ecr_repo_domain = '192549843005.dkr.ecr.eu-west-1.amazonaws.com'
        OUTFILE = "s3://distribution.concordium.software/tools/chrome/mysomeid-chrome-ext${VERSION}.zip"
    }
    stages {
        stage('ecr-login') {
            steps {
                ecrLogin(env.ecr_repo_domain, 'eu-west-1')
            }
        }
        stage('build') {
            agent {
                docker { 
                    image 'node:16-alpine'
                    reuseNode true
                }
            }
            environment {
                CI = false
                NODE_ENV = "production"
            }
            steps {
                dir('packages/chrome-ext') {
                    sh '''\
                        yarn install
                        yarn build
                    '''.stripIndent()
                    zip(zipFile: 'out.zip', archive: false, dir: './build')
                }
            }
            post {
                cleanup {
                    sh '''\
                        # Docker image has to run as root, otherwise user dosen't have access to node
                        # this means all generated files a owned by root, in workdir mounted from host
                        # meaning jenkins can't clean the files, so set owner of all files to jenkins
                        chown -R 1000:1000 .
                    '''.stripIndent()
                }
            }
        }
        stage('push') {
            steps {
                sh 'aws s3 cp "packages/chrome-ext/out.zip" "${OUTFILE}" --grants=read=uri=http://acs.amazonaws.com/groups/global/AllUsers'
            }
        }
    }
}
