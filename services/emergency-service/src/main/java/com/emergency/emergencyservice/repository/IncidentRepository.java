package com.emergency.emergencyservice.repository;

import com.emergency.emergencyservice.entity.Incident;
import com.emergency.emergencyservice.entity.IncidentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, UUID> {

    @Query(value = "SELECT * FROM incidents.incidents", nativeQuery = true)
    List<Incident> findAllIncidents();

    @Query(value = "SELECT * FROM incidents.incidents WHERE reporter_id = CAST(:reporterId AS uuid)", nativeQuery = true)
    List<Incident> findByReporterId(String reporterId);

    List<Incident> findByStatus(IncidentStatus status);

    List<Incident> findByCityAndStatus(String city, IncidentStatus status);
}