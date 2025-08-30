FROM jupyter/scipy-notebook:latest

USER root

# Install additional packages
RUN pip install --no-cache-dir \
    plotly \
    pandas \
    numpy \
    seaborn \
    matplotlib

USER $NB_UID

WORKDIR /home/jovyan/work